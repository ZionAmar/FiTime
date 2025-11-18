-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3308
-- Generation Time: Nov 19, 2025 at 12:13 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fitime`
--

-- --------------------------------------------------------

--
-- Table structure for table `meetings`
--

CREATE TABLE `meetings` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `trainer_id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `room_id` int(11) NOT NULL,
  `participant_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `trainer_arrival_time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `meetings`
--

INSERT INTO `meetings` (`id`, `studio_id`, `name`, `trainer_id`, `date`, `start_time`, `end_time`, `room_id`, `participant_count`, `created_at`, `trainer_arrival_time`) VALUES
(1, 1, 'פילאטיס למתחילים', 2, '2025-08-17', '10:00:00', '11:00:00', 1, 4, '2025-01-07 19:21:02', NULL),
(2, 1, 'יוגה מתקדמים', 3, '2025-08-15', '12:00:00', '13:30:00', 2, 12, '2025-01-07 19:21:02', NULL),
(3, 1, 'פילאטיס מתקדמים', 3, NULL, '15:00:00', '16:00:00', 1, 5, '2025-01-07 19:21:02', NULL),
(4, 1, 'אימון+', 3, '2025-08-21', '21:01:00', '22:01:00', 1, 1, '2025-08-18 20:05:19', '2025-08-19 20:00:50'),
(5, 1, 'בית', 3, '2025-08-17', '10:00:00', '11:00:00', 2, 2, '2025-09-08 19:08:34', NULL),
(6, 1, 'כככ', 2, '2025-08-17', '18:00:00', '19:00:00', 1, 0, '2025-09-08 19:10:39', NULL),
(7, 1, 'גגג', 3, '2025-08-17', '14:00:00', '15:00:00', 2, 0, '2025-09-08 19:11:00', NULL),
(8, 1, 'עעע', 2, '2025-09-08', '19:30:00', '20:30:00', 1, 0, '2025-09-08 19:59:18', NULL),
(9, 1, 'ססס', 2, '2025-09-22', '10:30:00', '11:30:00', 2, 2, '2025-09-21 07:09:49', NULL),
(10, 1, 'yyyy', 10, '2025-09-26', '09:00:00', '10:00:00', 2, 1, '2025-09-25 06:47:28', NULL),
(11, 1, 'pppp', 2, '2025-09-26', '09:00:00', '10:00:00', 1, 3, '2025-09-25 06:48:01', NULL),
(12, 1, 'אימון+', 2, '2025-10-26', '13:00:00', '14:00:00', 1, 1, '2025-09-25 07:33:12', NULL),
(22, 1, 'ללל', 2, '2025-09-26', '11:30:00', '12:30:00', 1, 0, '2025-09-25 15:30:05', NULL),
(23, 1, 'מממ', 10, '2025-09-26', '13:00:00', '14:00:00', 3, 0, '2025-09-25 15:32:00', NULL),
(26, 1, 'אימון+', 10, '2025-09-28', '13:30:00', '14:30:00', 1, 1, '2025-09-27 18:06:12', NULL),
(27, 1, 'אימון+', 10, '2025-09-28', '13:30:00', '14:30:00', 2, 1, '2025-09-27 18:09:44', NULL),
(28, 1, 'אימון+', 2, '2025-09-28', '15:30:00', '16:30:00', 1, 1, '2025-09-27 18:20:10', NULL),
(29, 1, 'עעע', 3, '2025-09-28', '15:54:00', '16:54:00', 2, 1, '2025-09-27 18:21:42', '2025-09-28 14:57:32'),
(30, 1, 'עעע', 10, '2025-10-29', '14:00:00', '15:00:00', 2, 1, '2025-09-28 15:02:34', NULL),
(31, 2, 'ששש', 16, '2025-11-10', '11:30:00', '12:30:00', 8, 1, '2025-11-05 18:28:40', NULL),
(32, 1, 'ששש', 2, '2025-11-06', '14:30:00', '15:30:00', 2, 1, '2025-11-05 18:31:42', NULL),
(33, 1, 'שי', 3, '2025-11-07', '12:00:00', '13:00:00', 2, 0, '2025-11-05 18:32:10', NULL),
(34, 1, 'ששש', 2, '2025-11-12', '15:30:00', '16:30:00', 2, 1, '2025-11-11 17:35:53', NULL),
(35, 1, 'אימון+', 2, '2025-11-17', '15:00:00', '16:00:00', 2, 2, '2025-11-16 16:59:15', NULL),
(36, 1, 'ססס', 10, '2025-11-18', '13:00:00', '14:00:00', 2, 2, '2025-11-17 19:00:33', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `meeting_registrations`
--

CREATE TABLE `meeting_registrations` (
  `id` int(11) NOT NULL,
  `meeting_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_membership_id` int(11) DEFAULT NULL,
  `pending_sent_at` datetime DEFAULT NULL,
  `notification_retries` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','waiting','cancelled','pending','checked_in') NOT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `check_in_time` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `meeting_registrations`
--

INSERT INTO `meeting_registrations` (`id`, `meeting_id`, `user_id`, `user_membership_id`, `pending_sent_at`, `notification_retries`, `status`, `registered_at`, `check_in_time`) VALUES
(8, 2, 4, NULL, NULL, 0, 'active', '2025-04-02 22:53:09', NULL),
(11, 2, 5, NULL, NULL, 0, 'active', '2025-05-03 21:30:09', NULL),
(14, 1, 3, NULL, NULL, 0, 'active', '2025-09-08 19:06:46', NULL),
(15, 1, 2, NULL, NULL, 0, 'active', '2025-09-08 19:06:46', NULL),
(16, 1, 4, NULL, NULL, 0, 'active', '2025-09-08 19:06:46', NULL),
(17, 1, 1, NULL, NULL, 0, 'active', '2025-09-08 19:06:46', NULL),
(18, 5, 3, NULL, NULL, 0, 'active', '2025-09-08 19:52:59', NULL),
(19, 5, 1, NULL, NULL, 0, 'active', '2025-09-08 19:52:59', NULL),
(20, 4, 3, NULL, NULL, 0, 'active', '2025-09-08 19:53:57', NULL),
(31, 9, 8, NULL, NULL, 0, 'active', '2025-09-21 08:49:57', NULL),
(32, 9, 1, NULL, NULL, 0, 'cancelled', '2025-09-21 08:49:57', NULL),
(33, 9, 3, NULL, NULL, 0, 'active', '2025-09-21 08:50:42', NULL),
(38, 10, 3, NULL, NULL, 0, 'active', '2025-09-25 14:21:46', NULL),
(45, 11, 1, NULL, NULL, 0, 'active', '2025-09-25 15:34:58', NULL),
(46, 11, 8, NULL, NULL, 0, 'active', '2025-09-25 15:34:58', NULL),
(47, 11, 3, NULL, NULL, 0, 'active', '2025-09-25 15:34:58', NULL),
(49, 26, 1, NULL, NULL, 0, 'cancelled', '2025-09-27 18:06:12', NULL),
(50, 26, 3, NULL, NULL, 0, 'active', '2025-09-27 18:06:12', NULL),
(51, 27, 1, NULL, NULL, 0, 'cancelled', '2025-09-27 18:09:44', NULL),
(52, 27, 3, NULL, NULL, 0, 'active', '2025-09-27 18:09:44', NULL),
(54, 28, 1, NULL, NULL, 0, 'active', '2025-09-27 18:20:16', NULL),
(60, 29, 3, NULL, NULL, 0, 'checked_in', '2025-09-28 12:52:11', '2025-09-28 15:54:44'),
(64, 12, 3, NULL, NULL, 0, 'cancelled', '2025-10-03 12:50:33', NULL),
(65, 30, 3, NULL, NULL, 0, 'active', '2025-10-25 19:55:00', NULL),
(66, 12, 3, NULL, NULL, 0, 'active', '2025-10-25 20:25:36', NULL),
(68, 33, 3, NULL, NULL, 0, 'cancelled', '2025-11-05 18:32:10', NULL),
(80, 32, 1, NULL, NULL, 0, 'active', '2025-11-05 19:42:58', NULL),
(81, 32, 8, NULL, NULL, 0, 'cancelled', '2025-11-05 19:42:58', NULL),
(82, 32, 3, NULL, NULL, 0, 'pending', '2025-11-05 19:46:35', NULL),
(85, 34, 3, NULL, NULL, 0, 'cancelled', '2025-11-11 17:58:26', NULL),
(86, 34, 3, NULL, NULL, 0, 'cancelled', '2025-11-11 18:01:06', NULL),
(87, 34, 3, NULL, NULL, 0, 'cancelled', '2025-11-11 18:04:24', NULL),
(107, 35, 8, NULL, NULL, 0, 'active', '2025-11-16 18:23:27', NULL),
(108, 35, 1, NULL, NULL, 0, 'cancelled', '2025-11-16 18:23:27', NULL),
(109, 35, 3, 1, '2025-11-16 11:30:01', 2, 'cancelled', '2025-11-16 18:23:54', NULL),
(110, 35, 10, 2, '2025-11-16 20:31:00', 1, 'active', '2025-11-16 18:27:36', NULL),
(111, 31, 17, NULL, NULL, 0, 'active', '2025-11-17 17:44:56', NULL),
(112, 36, 1, NULL, NULL, 0, 'active', '2025-11-17 19:00:33', NULL),
(113, 36, 8, NULL, NULL, 0, 'active', '2025-11-17 19:00:33', NULL),
(114, 36, 3, 1, NULL, 0, 'waiting', '2025-11-17 19:11:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`) VALUES
(3, 'admin'),
(1, 'member'),
(4, 'owner'),
(2, 'trainer');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `capacity` int(11) NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `has_equipment` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `studio_id`, `name`, `capacity`, `is_available`, `has_equipment`, `created_at`) VALUES
(1, 1, 'Studio A', 10, 1, 1, '2025-01-07 19:20:36'),
(2, 1, 'Studio B', 2, 1, 1, '2025-01-07 19:20:36'),
(3, 1, 'Studio C', 8, 1, 0, '2025-01-07 19:20:36'),
(4, 4, 'kkk', 5, 1, 1, '2025-10-12 17:47:43'),
(5, 1, 'חדר', 4, 1, 1, '2025-10-25 19:55:31'),
(7, 2, 'חדרש', 2, 1, 1, '2025-10-25 20:30:59'),
(8, 2, 'חדר', 2, 1, 0, '2025-10-25 20:43:37');

-- --------------------------------------------------------

--
-- Table structure for table `studios`
--

CREATE TABLE `studios` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `subscription_status` varchar(50) NOT NULL DEFAULT 'trialing',
  `trial_ends_at` datetime DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `studios`
--

INSERT INTO `studios` (`id`, `name`, `address`, `phone_number`, `image_url`, `tagline`, `created_at`, `subscription_status`, `trial_ends_at`, `payment_id`) VALUES
(1, 'EasyFit Central TLV', 'דיזנגוף 123, תל אביב', '03-555-1233', '/images/studios/main.jpg', 'הלב הפועם של הכושר בעיר', '2025-08-19 21:32:53', 'trialing', NULL, NULL),
(2, 'הסטודיו שלי', NULL, NULL, NULL, 'מנמנמ', '2025-10-03 11:29:27', 'trialing', '2025-10-17 14:29:27', NULL),
(4, 'שלי', 'Pika', '0549774827', NULL, 'הסטודיו הכי חזק בעיר', '2025-10-08 06:54:36', 'trialing', NULL, NULL),
(7, 'www', NULL, NULL, NULL, NULL, '2025-11-05 15:30:43', 'trialing', '2025-11-19 17:30:43', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `studio_operating_hours`
--

CREATE TABLE `studio_operating_hours` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `day_of_week` int(11) NOT NULL,
  `open_time` time NOT NULL,
  `close_time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `studio_operating_hours`
--

INSERT INTO `studio_operating_hours` (`id`, `studio_id`, `day_of_week`, `open_time`, `close_time`) VALUES
(14, 1, 1, '06:00:00', '23:00:00'),
(15, 1, 2, '06:00:00', '22:00:00'),
(16, 1, 3, '06:00:00', '23:00:00'),
(17, 1, 4, '06:00:00', '23:00:00'),
(18, 1, 5, '06:00:00', '23:00:00'),
(19, 1, 6, '07:00:00', '16:00:00'),
(20, 1, 0, '00:00:00', '00:00:00'),
(28, 4, 1, '07:00:00', '23:00:00'),
(29, 4, 2, '08:00:00', '22:00:00'),
(30, 4, 3, '09:00:00', '23:00:00'),
(31, 4, 4, '00:00:00', '00:00:00'),
(32, 4, 5, '00:00:00', '00:00:00'),
(33, 4, 6, '00:00:00', '00:00:00'),
(34, 4, 0, '00:00:00', '00:00:00'),
(42, 2, 0, '00:00:00', '00:00:00'),
(43, 2, 1, '09:00:00', '23:00:00'),
(44, 2, 2, '00:00:00', '00:00:00'),
(45, 2, 3, '00:00:00', '00:00:00'),
(46, 2, 4, '00:00:00', '00:00:00'),
(47, 2, 5, '00:00:00', '00:00:00'),
(48, 2, 6, '00:00:00', '00:00:00'),
(49, 7, 0, '00:00:00', '00:00:00'),
(50, 7, 1, '00:00:00', '00:09:00'),
(51, 7, 2, '00:00:00', '00:00:00'),
(52, 7, 3, '00:00:00', '00:00:00'),
(53, 7, 4, '00:00:00', '00:00:00'),
(54, 7, 5, '00:00:00', '00:00:00'),
(55, 7, 6, '00:00:00', '00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `studio_products`
--

CREATE TABLE `studio_products` (
  `id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `visit_limit` int(11) DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `studio_products`
--

INSERT INTO `studio_products` (`id`, `studio_id`, `name`, `description`, `price`, `visit_limit`, `duration_days`, `is_active`, `created_at`) VALUES
(1, 2, 'מנוי חודשי', 'מנוי חודשי', 24.98, 12, 365, 1, '2025-11-11 15:38:56'),
(2, 1, 'מנוי מתאמן', '', 19.99, 2, NULL, 1, '2025-11-16 16:56:25'),
(3, 2, 'ל', '', 39.98, 20, NULL, 1, '2025-11-18 20:12:16');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(254) NOT NULL,
  `email` varchar(254) NOT NULL,
  `userName` varchar(100) NOT NULL,
  `phone` varchar(11) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `profile_picture_url` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `userName`, `phone`, `password_hash`, `created_at`, `profile_picture_url`, `status`) VALUES
(1, 'יוסי כהן', 'yossi@example.com', 'user_1', '0501234567', '09ae0bc54b66c7892169d06c30778cdb', '2025-01-07 19:19:56', NULL, 'active'),
(2, 'שרה לוי', 'sara@example.com', 'user_2', '0509876543', '09ae0bc54b66c7892169d06c30778cdb', '2025-01-07 19:19:56', NULL, 'active'),
(3, 'מיכאל ברק', 'michael@example.com', 'user_3', '0549774827', '09ae0bc54b66c7892169d06c30778cdb', '2025-01-07 19:19:56', '/avatars/avatar-3-1762370567051.png', 'active'),
(4, 'דוד לוי', 'david@example.com', 'user_4', '0549774827', 'hashed_password_4', '2025-01-07 19:19:56', NULL, 'active'),
(5, 'ציון עמר', 'zion0549774827@gmail.com', 'zion', '0549674437', 'c51cd8e64b0aeb778364765013df9ebe', '2025-04-15 21:45:21', '/avatars/avatar-5-1762809092716.png', 'active'),
(6, 'נתי', 'n@n', 'nati', '0501234567', '8572cb4d3df58209ecb52bade81541c3', '2025-06-11 17:10:16', NULL, 'active'),
(7, 'z', 'z@z', 'z', '1', '3879186336b2b4a1ad89cadf910a5b19', '2025-08-03 14:59:25', NULL, 'active'),
(8, 'ברוך', 'b@b', 'b', '1', '8572cb4d3df58209ecb52bade81541c3', '2025-09-19 14:10:54', NULL, 'active'),
(10, 'דוד', 'd@d', 'dudu', '0549774827', '8572cb4d3df58209ecb52bade81541c3', '2025-09-25 07:43:22', NULL, 'active'),
(11, 'אבי', 'a@a', 'avi', NULL, '8572cb4d3df58209ecb52bade81541c3', '2025-10-03 11:29:27', NULL, 'active'),
(12, 'zz', 'zz@z', 'zz', NULL, '8572cb4d3df58209ecb52bade81541c3', '2025-10-05 23:15:18', NULL, 'active'),
(13, 'יוסי קדוש', 'y@y', 'yosi', NULL, '8572cb4d3df58209ecb52bade81541c3', '2025-10-08 06:54:36', NULL, 'active'),
(14, 'llll', 'l@l', 'lll', '0549774827', '8572cb4d3df58209ecb52bade81541c3', '2025-10-12 17:46:29', NULL, 'active'),
(16, 'צביק', 'zz@p', 'zzz', '000', '8572cb4d3df58209ecb52bade81541c3', '2025-10-25 20:27:38', NULL, 'active'),
(17, 'פיק', 'p@p', 'ppp', '00', '8572cb4d3df58209ecb52bade81541c3', '2025-10-25 20:28:31', NULL, 'active'),
(19, 'wwwk', 'w@w', 'zi', NULL, '09ae0bc54b66c7892169d06c30778cdb', '2025-11-05 16:18:22', NULL, 'active'),
(20, 'יייי', 'h@h', 'hhh', '0', '8572cb4d3df58209ecb52bade81541c3', '2025-11-05 19:05:48', NULL, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `user_memberships`
--

CREATE TABLE `user_memberships` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `studio_product_id` int(11) DEFAULT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `start_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `visits_remaining` int(11) DEFAULT NULL,
  `status` enum('pending','active','expired','depleted','cancelled') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_memberships`
--

INSERT INTO `user_memberships` (`id`, `user_id`, `studio_id`, `studio_product_id`, `purchase_date`, `start_date`, `expiry_date`, `visits_remaining`, `status`) VALUES
(1, 3, 1, 2, '2025-11-16 17:02:43', '2025-11-16', NULL, 1, 'active'),
(2, 10, 1, 2, '2025-11-16 18:26:48', '2025-11-16', NULL, 1, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `studio_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `studio_id`, `role_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 1),
(3, 1, 2),
(3, 2, 3),
(5, 1, 4),
(6, 1, 3),
(8, 1, 1),
(8, 7, 3),
(10, 1, 1),
(10, 1, 2),
(11, 2, 3),
(14, 4, 2),
(16, 1, 2),
(16, 2, 2),
(17, 2, 1),
(17, 4, 3),
(20, 1, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `meetings`
--
ALTER TABLE `meetings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `trainer_id` (`trainer_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `meeting_registrations`
--
ALTER TABLE `meeting_registrations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `meeting_registrations_ibfk_1` (`meeting_id`),
  ADD KEY `meeting_registrations_ibfk_2` (`user_id`),
  ADD KEY `reg_to_membership` (`user_membership_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_studio_room_name` (`studio_id`,`name`);

--
-- Indexes for table `studios`
--
ALTER TABLE `studios`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `studio_operating_hours`
--
ALTER TABLE `studio_operating_hours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `studio_id` (`studio_id`);

--
-- Indexes for table `studio_products`
--
ALTER TABLE `studio_products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `studio_id` (`studio_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `userName` (`userName`);

--
-- Indexes for table `user_memberships`
--
ALTER TABLE `user_memberships`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `studio_id` (`studio_id`),
  ADD KEY `studio_product_id` (`studio_product_id`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`studio_id`,`role_id`),
  ADD KEY `studio_id` (`studio_id`),
  ADD KEY `role_id` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `meetings`
--
ALTER TABLE `meetings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `meeting_registrations`
--
ALTER TABLE `meeting_registrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `studios`
--
ALTER TABLE `studios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `studio_operating_hours`
--
ALTER TABLE `studio_operating_hours`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT for table `studio_products`
--
ALTER TABLE `studio_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `user_memberships`
--
ALTER TABLE `user_memberships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `meetings`
--
ALTER TABLE `meetings`
  ADD CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`trainer_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `meetings_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`);

--
-- Constraints for table `meeting_registrations`
--
ALTER TABLE `meeting_registrations`
  ADD CONSTRAINT `meeting_registrations_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`id`),
  ADD CONSTRAINT `meeting_registrations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reg_to_membership` FOREIGN KEY (`user_membership_id`) REFERENCES `user_memberships` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `studio_operating_hours`
--
ALTER TABLE `studio_operating_hours`
  ADD CONSTRAINT `studio_operating_hours_ibfk_1` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `studio_products`
--
ALTER TABLE `studio_products`
  ADD CONSTRAINT `products_to_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_memberships`
--
ALTER TABLE `user_memberships`
  ADD CONSTRAINT `membership_to_product` FOREIGN KEY (`studio_product_id`) REFERENCES `studio_products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `membership_to_studio` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `membership_to_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`studio_id`) REFERENCES `studios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
