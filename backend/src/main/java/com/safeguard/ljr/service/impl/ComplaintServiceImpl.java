package com.safeguard.ljr.service.impl;

import com.safeguard.ljr.service.ComplaintService;
import com.safeguard.service.FileService;

import com.safeguard.entity.Agency;
import com.safeguard.entity.Complaint;
import com.safeguard.entity.SpatialFeature;
import com.safeguard.enums.ComplaintStatus;
import com.safeguard.ljr.mapper.LjrComplaintMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service("ljrComplaintService")
@RequiredArgsConstructor
@Slf4j
public class ComplaintServiceImpl implements ComplaintService {

    private final LjrComplaintMapper complaintMapper;
    private final FileService fileService;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    private final com.safeguard.mapper.AgencyMapper agencyMapper;

    @Override
    @Transactional
    public Long createComplaint(Map<String, Object> data, org.springframework.web.multipart.MultipartFile file,
            Long userNo) {
        logToFile("DEBUG: [ComplaintService] Start creating complaint for user: " + userNo);
        logToFile("DEBUG: [ComplaintService] Incoming Data Map: " + data);

        String imagePath = (String) data.get("imagePath");
        if (file != null && !file.isEmpty()) {
            try {
                String fileName = fileService.storeFile(file);
                imagePath = "/uploads/" + fileName;
            } catch (Exception e) {
                log.error("Failed to upload file during complaint creation", e);
            }
        }

        // 1. Complaint 저장
        Complaint complaint = new Complaint();
        complaint.setCategory((String) data.get("category"));
        complaint.setTitle((String) data.get("title"));
        complaint.setContent((String) data.get("content"));
        complaint.setIsPublic((Boolean) data.get("isPublic"));
        complaint.setStatus(ComplaintStatus.UNPROCESSED);
        complaint.setUserNo(userNo);
        complaint.setImagePath(imagePath);

        // 위치 정보 설정
        @SuppressWarnings("unchecked")
        Map<String, Object> location = (Map<String, Object>) data.get("location");
        if (location != null) {
            String addr = (String) location.get("address");
            complaint.setAddress(addr);
            logToFile("DEBUG: [ComplaintService] Address set: " + addr);

            if (location.containsKey("lat") && location.containsKey("lng")) {
                complaint.setLatitude(Double.parseDouble(location.get("lat").toString()));
                complaint.setLongitude(Double.parseDouble(location.get("lng").toString()));
            }
        }

        // 기관 정보 설정 (AI 결과)
        // agencyCode(ApplyImage) 또는 agency_code(ApplyText)
        Long aiAgencyNo = null;
        Object codeObj = data.getOrDefault("agencyCode", data.get("agency_code"));

        if (codeObj != null) {
            try {
                long val = Long.parseLong(codeObj.toString());
                if (val > 0)
                    aiAgencyNo = val;
            } catch (Exception e) {
                logToFile("DEBUG: [ComplaintService] Failed to parse agency code: " + codeObj);
            }
        }

        // 코드가 없으면 이름으로 백엔드에서 다시 찾아보기 (agencyName, agency_name, agency)
        if (aiAgencyNo == null) {
            Object nameObj = data.getOrDefault("agencyName", data.getOrDefault("agency_name", data.get("agency")));
            if (nameObj != null && !nameObj.toString().isEmpty()) {
                String searchName = nameObj.toString();
                logToFile("DEBUG: [ComplaintService] Finding AI Agency by Name fallback: " + searchName);
                Agency match = agencyMapper.selectAgencyByName(searchName);
                if (match != null) {
                    aiAgencyNo = match.getAgencyNo();
                    logToFile("DEBUG: [ComplaintService] AI Agency Match Found: " + match.getAgencyName()
                            + " (ID: " + aiAgencyNo + ")");
                }
            }
        }

        if (aiAgencyNo != null) {
            complaint.setAgencyNo(aiAgencyNo);
            logToFile("DEBUG: [ComplaintService] Final AI Agency No: " + aiAgencyNo);
        }

        complaintMapper.insertComplaint(complaint);
        Long complaintNo = complaint.getComplaintNo();
        logToFile("DEBUG: [ComplaintService] Complaint inserted with No: " + complaintNo);

        // 2. Spatial Feature 저장
        if (location != null && location.containsKey("lat") && location.containsKey("lng")) {
            try {
                SpatialFeature sf = new SpatialFeature();
                sf.setComplaintNo(complaintNo);
                sf.setFeatureType("POINT");
                sf.setAddrText((String) location.get("address"));
                double lat = Double.parseDouble(location.get("lat").toString());
                double lng = Double.parseDouble(location.get("lng").toString());
                sf.setGeom(geometryFactory.createPoint(new Coordinate(lng, lat)));
                complaintMapper.insertSpatialFeature(sf);
            } catch (Exception e) {
                logToFile("DEBUG: [ComplaintService] Spatial feature insert failed: " + e.getMessage());
            }
        }

        // 3. 기관 매핑 (Multi-Agency Assignment)
        // A. 소관 부처 (AI 결과)
        if (aiAgencyNo != null) {
            complaintMapper.insertComplaintAgency(complaintNo, aiAgencyNo);
            logToFile("DEBUG: [ComplaintService] Inserted AI Agency Relationship: " + aiAgencyNo);
        }

        // B. 관할 지자체 (주소 기반)
        if (complaint.getAddress() != null && !complaint.getAddress().isEmpty()) {
            String[] addrParts = complaint.getAddress().split(" ");
            if (addrParts.length > 0) {
                String regionName = addrParts[0];
                logToFile("DEBUG: [ComplaintService] Region lookup start: " + regionName);

                Agency regionAgency = agencyMapper.selectAgencyByName(regionName);

                if (regionAgency != null) {
                    Long regionNo = regionAgency.getAgencyNo();
                    logToFile("DEBUG: [ComplaintService] Found Region Agency: " + regionAgency.getAgencyName()
                            + "(" + regionNo + ")");

                    // 중복 방지
                    if (aiAgencyNo == null || !aiAgencyNo.equals(regionNo)) {
                        complaintMapper.insertComplaintAgency(complaintNo, regionNo);
                        logToFile("DEBUG: [ComplaintService] Inserted Regional Agency Relationship: " + regionNo);
                    } else {
                        logToFile("DEBUG: [ComplaintService] Regional Agency skipped (same as AI Agency)");
                    }
                } else {
                    logToFile("DEBUG: [ComplaintService] Region lookup failed for: " + regionName);
                }
            }
        }

        return complaintNo;
    }

    @Override
    public Map<String, Object> getDashboardStats(Long agencyNo, String category) {
        log.info("Fetching dashboard stats for agencyNo: {}, category: {}", agencyNo, category);

        Map<String, Object> stats = new java.util.HashMap<>();

        // 1. 요약 정보 (Total, Received, Processing, Completed)
        List<Map<String, Object>> summaryList = complaintMapper.selectComplaintStats(agencyNo);
        if (summaryList != null && !summaryList.isEmpty()) {
            stats.put("summary", summaryList.get(0));
        } else {
            stats.put("summary", Map.of("total", 0, "received", 0, "processing", 0, "completed", 0));
        }

        // 2. 카테고리별 분포 (Top Categories)
        stats.put("categoryStats", complaintMapper.selectCategoryStats(agencyNo));

        // 3. 월별 트렌드 (최근 6개월) - 카테고리 필터 적용
        stats.put("monthlyTrend", complaintMapper.selectMonthlyTrend(category));

        // 4. 기관별 병목 (미처리 TOP 10)
        stats.put("bottleneck", complaintMapper.selectAgencyBottleneck());

        // 5. 구별 지연 (Overdue TOP 10)
        stats.put("bottleneckOverdue", complaintMapper.selectDistrictOverdue());

        // 6. 연령별 민원 현황
        stats.put("ageGroupStats", complaintMapper.selectAgeGroupStats());

        // 7. 지연 민원 상세 리스트 (SLA Overdue)
        stats.put("overdueList", complaintMapper.selectOverdueComplaintList());

        return stats;
    }

    private void logToFile(String message) {
        String logPath = "./backend_debug.log";
        try (FileWriter fw = new FileWriter(logPath, true);
                PrintWriter pw = new PrintWriter(fw)) {
            pw.println("[" + LocalDateTime.now() + "] " + message);
        } catch (IOException e) {
            log.error("Failed to write to debug log file", e);
        }
    }
}
