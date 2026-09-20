package com.daylog.repository;

import com.daylog.entity.DayEvent;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DayEventRepository extends JpaRepository<DayEvent, Long> {
    @Query("""
        select e from DayEvent e
        left join fetch e.place
        where e.user.id = :userId
          and e.timestamp >= :start
          and e.timestamp < :end
        order by e.timestamp asc
        """)
    List<DayEvent> findForDate(@Param("userId") Long userId,
                               @Param("start") LocalDateTime start,
                               @Param("end") LocalDateTime end);

    @Query("select e from DayEvent e left join fetch e.place where e.id = :eventId and e.user.id = :userId")
    Optional<DayEvent> findForUser(@Param("eventId") Long eventId, @Param("userId") Long userId);
}