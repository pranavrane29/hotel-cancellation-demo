CREATE TABLE `predictionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingDetails` json NOT NULL,
	`cancellationProbability` double NOT NULL,
	`confidence` double NOT NULL,
	`riskLabel` enum('Low','Medium','High') NOT NULL,
	`recommendation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictionHistory_id` PRIMARY KEY(`id`)
);
