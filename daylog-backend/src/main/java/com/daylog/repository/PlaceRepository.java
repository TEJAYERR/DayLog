package com.daylog.repository;

import com.daylog.entity.Place;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaceRepository extends JpaRepository<Place, Long> {
    @Query("select p from Place p where p.user.id = :userId order by p.name asc")
    List<Place> findAllForUser(@Param("userId") Long userId);

    @Query("select p from Place p where p.id = :placeId and p.user.id = :userId")
    Optional<Place> findForUser(@Param("placeId") Long placeId, @Param("userId") Long userId);
}