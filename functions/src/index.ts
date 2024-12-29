/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { TelegramService } from "./telegram.service";

// Webhook endpoint for Telegram updates
export const telegramWebhook = onRequest(async (request, response) => {
  try {
    if (request.method !== "POST") {
      response.status(405).send("Method not allowed");
      return;
    }

    // Get configuration
    const config = functions.config();
    const botToken = config.telegram?.bot_token;
    const gameShortName = config.telegram?.game_short_name;
    const webAppUrl = config.telegram?.webapp_url;

    if (!botToken || !gameShortName || !webAppUrl) {
      throw new Error("Missing required configuration. Please set telegram.bot_token, telegram.game_short_name, and telegram.webapp_url");
    }

    // Initialize the Telegram service
    const telegramService = new TelegramService(botToken);

    // Handle the update
    const update = request.body;
    await telegramService.handleUpdate(update, gameShortName, webAppUrl);
    response.status(200).send("OK");
  } catch (error) {
    logger.error("Error processing webhook:", error);
    response.status(500).send("Internal server error");
  }
});
