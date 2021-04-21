const imports = require('../../../imports');
var glofunc = require('../../../globalfunctions');
const Discord = require('discord.js');
const ytdl = require("ytdl-core");

module.exports = {

	run: async function SimpleCommand(msg, args) {
		const serverQueue = imports.MusicQueue.get(msg.guild.id);
		if (!msg.member.voice.channel){
			msg.channel.send('You have to be in a voice channel to stop the music!');
			return;
		}
		if (!serverQueue){
			msg.channel.send('There is no song that I could skip!');
			return;
		}
		msg.channel.send(":track_next: Skipping song...");
		serverQueue.connection.dispatcher.end();
		

	},
	ModuleType: "command",
	Permissions: 0,
	CommandToggleWhitelist: false,
	CommandWhitelist: [],
	CommandRunGuild: true,
	CommandRunDM: false,
	CommandName: ["skip", "s"]


};