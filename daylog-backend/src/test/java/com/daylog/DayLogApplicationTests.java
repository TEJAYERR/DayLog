package com.daylog;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.daylog.ai.AiProvider;
import com.daylog.ai.DailyInsight;
import com.daylog.dto.TimeBreakdownItem;
import com.daylog.entity.EventCategory;
import com.daylog.entity.EventType;
import com.daylog.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DayLogApplicationTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private AiProvider aiProvider;

    @Test
    void registrationLoginAndAuthenticatedAccessWork() throws Exception {
        String registration = """
            {"name":"Asha","email":"asha@example.com","password":"password123"}
            """;
        String response = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registration))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").isString())
            .andReturn().getResponse().getContentAsString();
        String token = objectMapper.readTree(response).get("token").asText();

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"asha@example.com","password":"password123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("asha@example.com"));

        mockMvc.perform(get("/api/places")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void usersCanOnlySeeTheirOwnPlaces() throws Exception {
        String firstToken = registerAndGetToken("one@example.com");
        String secondToken = registerAndGetToken("two@example.com");

        String place = """
            {"name":"Home","latitude":12.9,"longitude":77.6,"radius":100}
            """;
        mockMvc.perform(post("/api/places")
                .header("Authorization", "Bearer " + firstToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(place))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/places")
                .header("Authorization", "Bearer " + secondToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void eventsAreCreatedAndReturnedInDateOrder() throws Exception {
        String token = registerAndGetToken("events@example.com");
        String date = LocalDate.now().toString();
        createEvent(token, "Later", date + "T10:00:00");
        createEvent(token, "Earlier", date + "T08:00:00");

        mockMvc.perform(get("/api/events").param("date", date)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].title").value("Earlier"))
            .andExpect(jsonPath("$[1].title").value("Later"));
    }

    @Test
    void aiProviderIsMockedForExplainDay() throws Exception {
        when(aiProvider.explainDay(any(), any())).thenReturn(new DailyInsight(
            "A recorded day",
            List.of("Recorded one activity"),
            List.of(new TimeBreakdownItem("Study", 60)),
            List.of("No other details were recorded")
        ));
        String token = registerAndGetToken("ai@example.com");

        mockMvc.perform(post("/api/ai/explain-day")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"date":"2026-09-19"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.summary").value("A recorded day"));
    }

    private String registerAndGetToken(String email) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Test User","email":"%s","password":"password123"}
                    """.formatted(email)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }

    private void createEvent(String token, String title, String timestamp) throws Exception {
        mockMvc.perform(post("/api/events")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"eventType":"ACTIVITY","title":"%s","timestamp":"%s","category":"STUDY"}
                    """.formatted(title, timestamp)))
            .andExpect(status().isOk());
    }
}