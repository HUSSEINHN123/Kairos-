// ⚙️ أمر مغادرة احترافي - خاص بالمطور ⚙️
const approvedEmoji = '👍';
const developerID = "100081948980908";

module.exports.config = {
  name: "غادر",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "محمد إدريس + GPT-5",
  description: "يجعل البوت يغادر المجموعة",
  commandCategory: "المطور",
  usages: "غادر",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // لو المطور هو اللي كتب غادر
  if (senderID === developerID) {
    return api.sendMessage("تفاعل ب 👍 للتأكيد", threadID, (err, info) => {
      if (err) return console.error(err);

      // مراقبة التفاعل
      global.client.handleReaction.push({
        name: this.config.name,
        messageID: info.messageID,
        author: developerID,
        threadID: threadID
      });
    }, messageID);
  } else {
    // لو عضو عادي حاول يخلي البوت يغادر
    return api.sendMessage("قاعد في بيت امك؟", threadID, messageID);
  }
};

// حدث التفاعل بالرموز
module.exports.handleReaction = async function({ api, event, handleReaction }) {
  const { userID, threadID, reaction } = event;

  // تحقق إن اللي تفاعل هو المطور وإنه حط 👍
  if (userID !== handleReaction.author || reaction !== approvedEmoji) return;

  // الجملة قبل المغادرة (معدلة)
  await api.sendMessage(
    "اي شايف ابوك دا قال يخارجو البوت لو دايرو امش بيع ليو كرامتك خاص ₍𖠂-𖠂₎",
    threadID
  );

  // مغادرة المجموعة
  setTimeout(() => {
    api.removeUserFromGroup(api.getCurrentUserID(), threadID);
  }, 2000);
};
