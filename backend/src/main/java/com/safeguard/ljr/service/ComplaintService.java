package com.safeguard.ljr.service;

import java.util.Map;

public interface ComplaintService {
    Long createComplaint(Map<String, Object> data, org.springframework.web.multipart.MultipartFile file, Long userNo);

    java.util.Map<String, Object> getDashboardStats(Long agencyNo, String category);
}
