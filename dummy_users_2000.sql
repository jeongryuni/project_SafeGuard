-- ============================================================
-- 4. Dummy Data Generation (Users & Complaints)
-- ※ 주의: 이 스크립트는 'manual_reset.sql' 실행 후 실행해야 합니다.
-- ============================================================

DO $$
DECLARE
    -- User Arrays
    last_names text[] := ARRAY['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
    first_names text[] := ARRAY['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서', '서윤', '서연', '지우', '하윤', '민서', '하은', '지유', '윤서', '지아', '나은'];
    addresses text[] := ARRAY['서울특별시 강남구', '서울특별시 서초구', '서울특별시 송파구', '서울특별시 강서구', '서울특별시 마포구', '서울특별시 영등포구', '서울특별시 성동구', '서울특별시 종로구', '경기도 수원시', '경기도 성남시', '인천광역시 중구', '부산광역시 해운대구', '대구광역시 수성구', '대전광역시 유성구', '광주광역시 북구'];
    
    -- Complaint Constants
    categories text[] := ARRAY['교통', '도로', '환경', '보건', '안전', '행정', '기타'];
    statuses text[] := ARRAY['UNPROCESSED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
    
    -- Loop Variables
    i INT;
    v_complaint_id BIGINT;
    v_user_id BIGINT;
    v_lat DOUBLE PRECISION;
    v_lng DOUBLE PRECISION;
    v_category TEXT;
    v_status TEXT;
    v_created_at TIMESTAMPTZ;
    v_rec RECORD; -- For Loop iteration
BEGIN
    RAISE NOTICE '1) 사용자 생성 시작...';
    -- 1) 사용자 생성 (2000명)
    INSERT INTO app_user (user_id, pw, name, birth_date, addr, phone, role)
    SELECT 
        'user' || seq AS user_id,
        '$2b$10$Ooc3cQIUzbXrux1X6AoN7e7g1Uf7TdGxPEo/SNPkTuo5IgPhoyh3u' AS pw, -- test1234
        last_names[floor(random() * 20 + 1)] || first_names[floor(random() * 20 + 1)] AS name,
        (CURRENT_DATE - (interval '15 years' + random() * interval '50 years'))::date AS birth_date,
        addresses[floor(random() * 15 + 1)] || ' ' || floor(random() * 1000 + 1) || '번지' AS addr,
        '010-' || LPAD(floor(random() * 10000)::text, 4, '0') || '-' || LPAD(floor(random() * 10000)::text, 4, '0') AS phone,
        'USER' AS role
    FROM generate_series(1, 2000) AS seq
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE '2) 민원 데이터 생성 시작...';
    -- 2) 민원 데이터 생성 (3000건)
    FOR i IN 1..3000 LOOP
        -- 랜덤 유저 선택
        v_user_id := floor(random() * 2000 + 1);
        
        -- 랜덤 좌표 (서울 근방 집중 + 전국 분포)
        IF random() < 0.7 THEN
             -- 서울/수도권 집중
             v_lat := 37.4 + random() * 0.3;
             v_lng := 126.8 + random() * 0.4;
        ELSE
             -- 전국 분포
             v_lat := 34.0 + random() * 4.0;
             v_lng := 126.0 + random() * 3.5;
        END IF;

        v_category := categories[floor(random() * 7 + 1)];
        v_status := statuses[floor(random() * 4 + 1)];
        -- 최근 3년 내 랜덤 날짜
        v_created_at := CURRENT_TIMESTAMP - (random() * interval '3 years');

        INSERT INTO complaint (
            category, title, content, address, latitude, longitude, 
            status, created_date, user_no
        ) VALUES (
            v_category,
            '민원 테스트 제목 ' || i,
            '민원 테스트 내용입니다. 불편합니다. 조치 부탁드립니다.',
            '대한민국 어느 곳',
            v_lat,
            v_lng,
            v_status,
            v_created_at,
            v_user_id
        ) RETURNING complaint_no INTO v_complaint_id;

        -- Agency 매핑
        INSERT INTO complaint_agency (complaint_no, agency_no)
        VALUES (
            v_complaint_id,
            (SELECT agency_no FROM agency ORDER BY random() LIMIT 1)
        );

        -- COMPLETED 상태인 경우 completed_date 업데이트
        IF v_status = 'COMPLETED' THEN
            UPDATE complaint 
            SET completed_date = v_created_at + (random() * interval '5 days')
            WHERE complaint_no = v_complaint_id;
        END IF;

    END LOOP;

    RAISE NOTICE '3) 공간 정보(Spatial Feature) 생성 시작...';
    -- 3) 공간 정보 (Spatial Feature) 생성
    INSERT INTO spatial_feature (feature_type, geom, addr_text, complaint_no, created_at)
    SELECT 
        'POINT',
        ST_SetSRID(ST_Point(longitude, latitude), 4326),
        address,
        complaint_no,
        created_date
    FROM complaint;

    RAISE NOTICE '4) 좋아요(Like) 데이터 생성 시작...';
    -- 4) 좋아요 (Complaint Like) 데이터 생성
    FOR v_rec IN (SELECT complaint_no FROM complaint TABLESAMPLE BERNOULLI(30)) LOOP
         INSERT INTO complaint_like (complaint_no, user_no, created_at)
         SELECT 
             v_rec.complaint_no,
             user_no,
             CURRENT_TIMESTAMP - (random() * interval '1 year')
         FROM app_user 
         ORDER BY random()
         LIMIT floor(random() * 50 + 1)
         ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '데이터 생성 완료!';
END $$;

-- 결과 확인
SELECT 'Users Created' as item, count(*) as count FROM app_user
UNION ALL
SELECT 'Complaints Created', count(*) FROM complaint
UNION ALL
SELECT 'Spatial Features', count(*) FROM spatial_feature
UNION ALL
SELECT 'Total Likes', count(*) FROM complaint_like;
