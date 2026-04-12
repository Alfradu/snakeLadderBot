import "dotenv/config.js";
import { state, registerBotHandlers } from "./bot.js";
import { startApi } from "./api.js";

registerBotHandlers();
startApi(parseInt(process.env.PORT, 10));
state.client.login(process.env.TOKEN!);
