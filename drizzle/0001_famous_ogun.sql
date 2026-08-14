CREATE TABLE `heartRiskHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inputSummary` json NOT NULL,
	`heartDiseaseProbability` double NOT NULL,
	`confidence` double NOT NULL,
	`signal` enum('Lower','Elevated') NOT NULL,
	`consentAcknowledged` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `heartRiskHistory_id` PRIMARY KEY(`id`)
);
