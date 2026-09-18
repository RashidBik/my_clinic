CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`icon` text,
	`color` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_org_slug_idx` ON `categories` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `categories_org_idx` ON `categories` (`organization_id`);--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`is_member` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`joined_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_org_user_idx` ON `members` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `members_org_idx` ON `members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `members_user_idx` ON `members` (`user_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`type` text NOT NULL,
	`preset_id` text,
	`settings` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`base_role` text NOT NULL,
	`description` text,
	`permissions` text DEFAULT '[]' NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_org_slug_idx` ON `roles` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `roles_org_idx` ON `roles` (`organization_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text,
	`password_hash` text,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE INDEX `users_phone_idx` ON `users` (`phone`);--> statement-breakpoint
CREATE TABLE `templates` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` text,
	`role_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`text_template` text NOT NULL,
	`fields` text DEFAULT '[]' NOT NULL,
	`actions` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `templates_org_slug_idx` ON `templates` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `templates_org_idx` ON `templates` (`organization_id`);--> statement-breakpoint
CREATE INDEX `templates_role_idx` ON `templates` (`role_id`);--> statement-breakpoint
CREATE INDEX `templates_category_idx` ON `templates` (`category_id`);--> statement-breakpoint
CREATE TABLE `record_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`step_id` text,
	`category_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`data` text NOT NULL,
	`visible_to_role` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`completed_by` text,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`step_id`) REFERENCES `workflow_steps`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `record_steps_record_idx` ON `record_steps` (`record_id`);--> statement-breakpoint
CREATE INDEX `record_steps_category_idx` ON `record_steps` (`category_id`);--> statement-breakpoint
CREATE INDEX `record_steps_status_idx` ON `record_steps` (`status`);--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`workflow_id` text,
	`current_step_id` text,
	`reference_code` text NOT NULL,
	`status` text DEFAULT 'waiting' NOT NULL,
	`assigned_to_role_id` text,
	`assigned_to_user_id` text,
	`visible_to_roles` text,
	`visible_to_users` text,
	`metadata` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`current_step_id`) REFERENCES `workflow_steps`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to_role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `records_org_ref_idx` ON `records` (`organization_id`,`reference_code`);--> statement-breakpoint
CREATE INDEX `records_org_status_idx` ON `records` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `records_org_created_idx` ON `records` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `records_assigned_role_idx` ON `records` (`assigned_to_role_id`);--> statement-breakpoint
CREATE INDEX `records_assigned_user_idx` ON `records` (`assigned_to_user_id`);--> statement-breakpoint
CREATE TABLE `workflow_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`workflow_id` text NOT NULL,
	`step_order` integer NOT NULL,
	`category_id` text NOT NULL,
	`role_id` text,
	`template_id` text,
	`name` text NOT NULL,
	`description` text,
	`condition` text,
	`is_terminal` integer DEFAULT false NOT NULL,
	`is_optional` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workflow_steps_order_idx` ON `workflow_steps` (`workflow_id`,`step_order`);--> statement-breakpoint
CREATE INDEX `workflow_steps_workflow_idx` ON `workflow_steps` (`workflow_id`);--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workflows_org_slug_idx` ON `workflows` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `workflows_org_idx` ON `workflows` (`organization_id`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`message_type` text NOT NULL,
	`content` text NOT NULL,
	`record_id` text,
	`template_id` text,
	`template_data` text,
	`visible_to_roles` text,
	`edited_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `chat_org_created_idx` ON `chat_messages` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `chat_record_idx` ON `chat_messages` (`record_id`);--> statement-breakpoint
CREATE INDEX `chat_sender_idx` ON `chat_messages` (`sender_id`);--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`unit` text DEFAULT 'عدد' NOT NULL,
	`quantity` real DEFAULT 0 NOT NULL,
	`minimum_stock` real DEFAULT 0 NOT NULL,
	`purchase_price` real,
	`sale_price` real,
	`batch_number` text,
	`expiry_date` integer,
	`supplier` text,
	`metadata` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_items_org_slug_idx` ON `inventory_items` (`organization_id`,`slug`);--> statement-breakpoint
CREATE INDEX `inventory_items_org_idx` ON `inventory_items` (`organization_id`);--> statement-breakpoint
CREATE INDEX `inventory_items_category_idx` ON `inventory_items` (`category_id`);--> statement-breakpoint
CREATE INDEX `inventory_items_expiry_idx` ON `inventory_items` (`expiry_date`);--> statement-breakpoint
CREATE TABLE `inventory_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`item_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` real,
	`total_price` real,
	`record_id` text,
	`notes` text,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `inventory_tx_org_created_idx` ON `inventory_transactions` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `inventory_tx_item_idx` ON `inventory_transactions` (`item_id`);--> statement-breakpoint
CREATE INDEX `inventory_tx_record_idx` ON `inventory_transactions` (`record_id`);--> statement-breakpoint
CREATE INDEX `inventory_tx_type_idx` ON `inventory_transactions` (`type`);--> statement-breakpoint
CREATE TABLE `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`record_id` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'AFN' NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`creditor_name` text,
	`creditor_phone` text,
	`description` text,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`due_date` integer,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `debts_org_status_idx` ON `debts` (`organization_id`,`status`);--> statement-breakpoint
CREATE INDEX `debts_record_idx` ON `debts` (`record_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`category_id` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'AFN' NOT NULL,
	`description` text NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `expenses_org_created_idx` ON `expenses` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `expenses_category_idx` ON `expenses` (`category_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`record_id` text,
	`category_id` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'AFN' NOT NULL,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `payments_org_created_idx` ON `payments` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_record_idx` ON `payments` (`record_id`);--> statement-breakpoint
CREATE INDEX `payments_category_idx` ON `payments` (`category_id`);--> statement-breakpoint
CREATE INDEX `payments_method_idx` ON `payments` (`payment_method`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_org_created_idx` ON `audit_logs` (`organization_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_entity_idx` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE TABLE `operations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`result` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `operations_user_idx` ON `operations` (`user_id`);--> statement-breakpoint
CREATE INDEX `operations_created_idx` ON `operations` (`created_at`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`keys` text NOT NULL,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `push_subscriptions_endpoint_unique` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subs_user_idx` ON `push_subscriptions` (`user_id`);