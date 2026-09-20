package com.daylog.ai;

import com.daylog.entity.DayEvent;
import com.daylog.exception.AiConfigurationException;
import com.daylog.exception.AiProviderException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class BedrockAiProvider implements AiProvider {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String region;
    private final String modelId;
    private final String bearerToken;

    public BedrockAiProvider(
            ObjectMapper objectMapper,
            @Value("${app.bedrock.region:}") String region,
            @Value("${app.bedrock.model-id:}") String modelId,
            @Value("${app.bedrock.apikey:}") String bearerToken
    ) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.region = region;
        this.modelId = modelId;
        this.bearerToken = bearerToken;
    }

    @Override
    public DailyInsight explainDay(LocalDate date, List<DayEvent> events) {

        String prompt = """
            Analyze the user's DayLog for %s.

            Return JSON only with exactly these fields:
            {
              "summary": "string",
              "highlights": ["string"],
              "timeBreakdown": [
                {
                  "category": "string",
                  "minutes": 0
                }
              ],
              "observations": ["string"]
            }

            IMPORTANT RULES:

            1. Use ONLY information explicitly present in the recorded events.

            2. Do not invent or assume:
               - activities
               - locations
               - people
               - accomplishments
               - emotions
               - conversations
               - intentions
               - durations
               - events

            3. Write the summary naturally.
               Describe what the recorded day shows rather than simply repeating
               every event in chronological order.

            4. Highlights must contain meaningful things from the recorded day.
               Do not make every location transition a separate highlight unless
               the movement itself is meaningful.

            5. Do not include exact timestamps in highlights unless the exact time
               is important to understanding the event.

            6. A location event only proves that the user arrived at or left
               the recorded place. Do not infer what the user was doing there.

            7. Do not describe a movement as "brief", "long", "most of the day",
               or similar unless that can be directly established from the
               recorded timestamps.

            8. timeBreakdown must contain ONLY durations that can be reliably
               calculated from the recorded events.
               If reliable durations cannot be determined, return an empty array.

            9. Do not calculate time spent at a place unless there is a clear
               arrival and departure pair that supports that calculation.

            10. Observations should be useful but strictly grounded in the data.
                Do not turn assumptions into observations.

            11. If the day contains mostly location events, simply describe the
                recorded movement between places. Do not pretend the user had
                activities that were not recorded.

            Recorded events:
            %s
            """.formatted(date, formatEvents(events));

        String response = invoke(prompt);

        try {
            return objectMapper.readValue(
                    stripMarkdownFence(response),
                    DailyInsight.class
            );
        } catch (Exception exception) {
            throw new AiProviderException(
                    "Bedrock returned an invalid explain-day response",
                    exception
            );
        }
    }

    @Override
    public String answerQuestion(
            LocalDate date,
            String question,
            List<DayEvent> events
    ) {
        String prompt = """
            Answer this question about the user's recorded DayLog for %s:
            %s

            Use only the recorded events below.

            Do not infer or invent:
            - locations
            - activities
            - people
            - accomplishments
            - durations
            - emotions
            - conversations
            - events

            If the answer cannot be found in the recorded events, respond exactly:
            I don't see a recorded event for that.

            Recorded events:
            %s
            """.formatted(date, question, formatEvents(events));

        return invoke(prompt).trim();
    }

    private String invoke(String prompt) {
        validateConfiguration();

        try {
            String requestBody = """
                {
                  "system": [
                    {
                      "text": "You are a grounded DayLog assistant. Never claim anything that is not in the supplied events."
                    }
                  ],
                  "messages": [
                    {
                      "role": "user",
                      "content": [
                        {
                          "text": %s
                        }
                      ]
                    }
                  ]
                }
                """.formatted(
                    objectMapper.writeValueAsString(prompt)
            );

            String endpoint = "https://bedrock-runtime.%s.amazonaws.com/model/%s/converse"
                    .formatted(region, modelId);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + bearerToken)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AiProviderException(
                        "Amazon Bedrock returned HTTP "
                                + response.statusCode()
                                + ": "
                                + response.body(),
                        new RuntimeException("Bedrock API request failed")
                );
            }

            JsonNode root = objectMapper.readTree(response.body());

            return root
                    .path("output")
                    .path("message")
                    .path("content")
                    .elements()
                    .next()
                    .path("text")
                    .asText();

        } catch (AiConfigurationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AiProviderException(
                    "Amazon Bedrock could not answer the request",
                    exception
            );
        }
    }

    private void validateConfiguration() {
        if (region.isBlank()
                || modelId.isBlank()
                || bearerToken.isBlank()) {

            throw new AiConfigurationException(
                    "AI is not configured. Set AWS_REGION, BEDROCK_MODEL_ID, and AWS_BEARER_TOKEN_BEDROCK."
            );
        }
    }

    private String formatEvents(List<DayEvent> events) {
        if (events.isEmpty()) {
            return "No events were recorded.";
        }

        return events.stream()
                .map(event -> {
                    String place = event.getPlace() == null
                            ? ""
                            : " at " + event.getPlace().getName();

                    String category = event.getCategory() == null
                            ? ""
                            : " [" + event.getCategory() + "]";

                    String description = event.getDescription() == null
                            ? ""
                            : " — " + event.getDescription();

                    return "- %s | %s%s%s%s".formatted(
                            event.getTimestamp(),
                            event.getEventType(),
                            place,
                            category,
                            description
                    );
                })
                .collect(Collectors.joining("\n"));
    }

    private String stripMarkdownFence(String response) {
        String cleaned = response.trim();

        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }

        return cleaned.trim();
    }
}