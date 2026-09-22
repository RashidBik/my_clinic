ALTER TABLE `chat_messages` ADD `next_role_id` text REFERENCES roles(id);--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `record_status` text;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `reference_code` text;