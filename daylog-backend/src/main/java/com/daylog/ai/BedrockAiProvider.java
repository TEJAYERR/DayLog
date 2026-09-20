package com.daylog.ai;

import com.daylog.dto.TimeBreakdownItem;
import com.daylog.entity.DayEvent;
import com.daylog.exception.AiConfigurationException;
import com.daylog.exception.AiProviderException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseResponse;
import software.amazon.awssdk.services.bedrockruntime.model.Message;
import software.amazon.awssdk.services.bedrockruntime.model.SystemContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;

@Component
public class BedrockAiProvider implements AiProvider {
    private final ObjectMapper objectMapper;
    private final String region;
    private final String modelId;
    private final String accessKeyId;
    private final String secretAccessKey;

    public BedrockAiProvider(
        ObjectMapper objectMapper,
        @Value("${app.bedrock.region:}") String region,
        @Value("${app.bedrock.model-id:}") String modelId,
        @Value("${AWS_ACCESS_KEY_ID:}") String accessKeyId,
        @Value("${AWS_SECRET_ACCESS_KEY:}") String secretAccessKey
    ) {
        this.objectMapper = objectMapper;
        this.region = region;
        this.modelId = modelId;
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
    }

    @Override
    public DailyInsight explainDay(LocalDate date, List<DayEvent> events) {
        String prompt = """
            Explain the DayLog for %s.
            Return JSON only with exactly these fields:
            {"summary":"string","highlights":["string"],"timeBreakdown":[{"category":"string","minutes":0}],"observations":["string"]}
            Use only the recorded events below. Do not invent locations, people, activities, accomplishments,
            times, emotions, conversations, or events. If something is not recorded, say it is not recorded.
            Include a timeBreakdown item only when a duration can be reliably calculated from the event timestamps.
            
            Recorded events:
            %s
            """.formatted(date, formatEvents(events));
        String response = invoke(prompt);
        try {
            return objectMapper.readValue(stripMarkdownFence(response), DailyInsight.class);
        } catch (Exception exception) {
            throw new AiProviderException("Bedrock returned an invalid explain-day response", exception);
        }
    }

    @Override
    public String answerQuestion(LocalDate date, String question, List<DayEvent> events) {
        String prompt = """
            Answer this question about the user's recorded DayLog for %s:
            %s
            
            Use only the recorded events below. Do not infer or invent anything. If the answer is absent,
            respond exactly: I don't see a recorded event for that.
            
            Recorded events:
            %s
            """.formatted(date, question, formatEvents(events));
        return invoke(prompt).trim();
    }

    private String invoke(String prompt) {
        validateConfiguration();
        try (BedrockRuntimeClient client = BedrockRuntimeClient.builder()
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
            .build()) {
            ConverseRequest request = ConverseRequest.builder()
                .modelId(modelId)
                .system(SystemContentBlock.builder().text(
                    "You are a grounded DayLog assistant. Never claim anything that is not in the supplied events."
                ).build())
                .messages(Message.builder()
                    .role(ConversationRole.USER)
                    .content(ContentBlock.builder().text(prompt).build())
                    .build())
                .build();
            ConverseResponse response = client.converse(request);
            return response.output().message().content().stream()
                .map(ContentBlock::text)
                .filter(text -> text != null && !text.isBlank())
                .collect(Collectors.joining("\n"));
        } catch (AiConfigurationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AiProviderException("Amazon Bedrock could not answer the request", exception);
        }
    }

    private void validateConfiguration() {
        if (region.isBlank() || modelId.isBlank()
            || accessKeyId.isBlank() || secretAccessKey.isBlank()) {
            throw new AiConfigurationException(
                "AI is not configured. Set AWS_REGION, BEDROCK_MODEL_ID, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY."
            );
        }
    }

    private String formatEvents(List<DayEvent> events) {
        if (events.isEmpty()) {
            return "No events were recorded.";
        }
        return events.stream()
            .map(event -> {
                String place = event.getPlace() == null ? "" : " at " + event.getPlace().getName();
                String category = event.getCategory() == null ? "" : " [" + event.getCategory() + "]";
                String description = event.getDescription() == null ? "" : " — " + event.getDescription();
                return "- %s | %s%s%s%s".formatted(
                    event.getTimestamp(), event.getEventType(), place, category, description
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