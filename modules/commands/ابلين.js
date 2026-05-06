const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// مسار تخزين القائمة السوداء
const blacklistPath = path.join(__dirname, "cache", "blacklist.json");

if (!global.ابلين_mode) global.ابلين_mode = {};

module.exports.config = {
  name: "ابلين",
  version: "5.0.0",
  credits: "SINKO",
  hasPermssion: 0,
  description: "ذكاء اصطناعي + تحكم بالمطور",
  commandCategory: "ai",
  usages: "[نص]",
  cooldowns: 1
};

// ================== BLACKLIST ==================
function getBlacklist() {
  if (!fs.existsSync(blacklistPath)) fs.writeJsonSync(blacklistPath, []);
  return fs.readJsonSync(blacklistPath);
}

// ================== HANDLE REPLY ==================
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (handleReply.author !== senderID) return;

  const isDev = senderID === "61588108307572" || senderID === "100079668997780";

  try {
    const response = await askGPT(body);

    if ((global.ابلين_mode[threadID] || "text_only") === "voice_only") {
      return handleVoice(api, event, response);
    } else {
      api.sendMessage(response, threadID, (err, info) => {
        if (!err) {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: senderID
          });
        }
      }, messageID);
    }

  } catch (e) {
    console.error(e);
  }
};

// ================== RUN ==================
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const query = args.join(" ").trim();

  const developerID = "100081948980908";

  // وضع الصوت
  if (query === "اون") {
    global.ابلين_mode[threadID] = "voice_only";
    return api.sendMessage("🎤 تم تفعيل وضع الصوت.", threadID, messageID);
  }

  if (query === "اوف") {
    global.ابلين_mode[threadID] = "text_only";
    return api.sendMessage("📄 تم تفعيل وضع النص.", threadID, messageID);
  }

  if (!query) {
    return api.sendMessage("✍️ اكتب شيء عشان ارد عليك.", threadID, messageID);
  }

  try {
    const response = await askGPT(query);

    if ((global.ابلين_mode[threadID] || "text_only") === "voice_only") {
      return handleVoice(api, event, response);
    } else {
      return api.sendMessage(response, threadID, (err, info) => {
        if (!err) {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: senderID
          });
        }
      }, messageID);
    }

  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ صار خطأ في الاتصال.", threadID, messageID);
  }
};

// ================== GPT API ==================
async function askGPT(query) {
  try {
    const res = await axios.post(
      "https://chatgpt-42.p.rapidapi.com/conversationgpt4-2",
      {
        messages: [{ role: "user", content: query }],
        system_prompt: "انت بوت دردشة ذكي، رد بطريقة لطيفة وبالعربي.",
        temperature: 0.9,
        top_k: 5,
        top_p: 0.9,
        max_tokens: 256,
        web_access: false
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "chatgpt-42.p.rapidapi.com",
          "x-rapidapi-key": "a551cb9ce4msh02596fa2c96a8a0p18d329jsnc4e219945e37"
        }
      }
    );

    return res.data?.result || "⚠️ ما وصل رد.";
  } catch (e) {
    console.error("API ERROR:", e.response?.data || e.message);
    throw e;
  }
}

// ================== VOICE ==================
async function handleVoice(api, event, text) {
  const pathAudio = path.resolve(__dirname, 'cache', `${event.messageID}.mp3`);
  try {
    const { data } = await axios.get(
      `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ar&client=tw-ob`,
      { responseType: "arraybuffer" }
    );

    fs.ensureDirSync(path.join(__dirname, 'cache'));
    fs.writeFileSync(pathAudio, Buffer.from(data, "utf-8"));

    return api.sendMessage(
      { attachment: fs.createReadStream(pathAudio) },
      event.threadID,
      () => fs.unlinkSync(pathAudio),
      event.messageID
    );
  } catch (e) {
    if (fs.existsSync(pathAudio)) fs.unlinkSync(pathAudio);
    return api.sendMessage(text, event.threadID, event.messageID);
  }
}
