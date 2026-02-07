-- Optional performance indexes for FiTime / EasyFit
-- Run this file once on an existing database to speed up schedule and list queries
-- when you have many users and meetings.
-- If you get "Duplicate key name" errors, the indexes already exist — that's fine.

-- Meetings: filter by studio and date (schedule views)
ALTER TABLE `meetings` ADD KEY `idx_meetings_studio_date` (`studio_id`, `date`);

-- Meeting registrations: filter by meeting and status (participants list, waiting list)
ALTER TABLE `meeting_registrations` ADD KEY `idx_reg_status` (`meeting_id`, `status`);

-- User roles: list users by studio (admin dashboards)
ALTER TABLE `user_roles` ADD KEY `idx_studio_role` (`studio_id`, `role_id`);
