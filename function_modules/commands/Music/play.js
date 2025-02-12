const imports = require('../../../imports');
var glofunc = require('../../../globalfunctions');
const Discord = require('discord.js');
const ytdl = require("discord-ytdl-core");
const ytsr = require("ytsr");
const axios = require('axios');


module.exports = {

	run: async function SimpleCommand(msg, args) {
		var song;
		const allowed_filetypes = ["flac", "wav", "mp3", "mp4", "webm", "avi"];
		const voiceChannel = msg.member.voice.channel;
		
		if (!voiceChannel) {
			msg.channel.send("You need to be in a voice channel to play music!");
			return;
		}

		const permissions = voiceChannel.permissionsFor(msg.client.user);

		if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
			msg.channel.send("I need the permissions to join and speak in your voice channel!");
			return;
		}
		
		
		
		/*
		type of media:
		0 -> YouTube
		1 -> Project Video
		2 -> Soundcloud
		3 -> file
		*/
		
		
		
		
		//Use Project Video
		if (msg.attachments.size > 0) {
			if(msg.attachments.size == 1){
				var found = false;
				
				for (var i in allowed_filetypes){
					var Attachment = (msg.attachments).array();
					var url = Attachment[0].url;
					
					
					if(url.includes(allowed_filetypes[i])){
						song = {
							type: 3,
							title: "UNKNOWN(From file)",
							url: url,
							length: -1,
							author: "UNKNOWN"
						};
						found = true;
					}
				}
				if(!found){
					msg.channel.send("Please upload a vailid file type.");
				}
				
				
			} else {
				msg.channel.send("Please upload only 1 file at the time.");
				return;

			}
			
		
		} else if(args[0].toString().includes("enthix")){
			
			var video_id = args[0].toString().split('v=')[1];
			var ampersandPosition = video_id.indexOf('&');
			
			if(ampersandPosition != -1) {
				video_id = video_id.substring(0, ampersandPosition);
			}
			
			
			await axios.get("https://www.enthix.net/video/API/v1/getVideoInfo.php?v=" + video_id).then(function (response) {
			
				song = {
					type: 1,
					title: response.data.title,
					url: "https://www.enthix.net/video/backend/buffer_video.php?v=" + video_id,
					length: parseInt(response.data.length),
					timeleft: 0,
					author: response.data.author,
					thumbnail: "https://www.enthix.net/video/backend/thumbnail_proxy.php?id=" + video_id
				};
				
				
				
			}).catch(function (error) {
				console.log(error);
				return;
			})
		//Use SoundCloud
		} else if(args[0].toString().includes("soundcloud")){
			
			await axios.get("http://api.soundcloud.com/resolve.json?url=" + args[0] + "&client_id=71dfa98f05fa01cb3ded3265b9672aaf").then(function (response) {
				
				song = {
					type: 2,
					title: response.data.title,
					url: "http://api.soundcloud.com/tracks/" + response.data.id + "/stream?consumer_key=71dfa98f05fa01cb3ded3265b9672aaf",
					length: response.data.duration / 1000,
					timeleft: 0,
					author: response.data.user.username
				};
				
			}).catch(function (error) {
				console.log(error);
				return;
			})




		//Use Youtube
		} else if(ytdl.validateURL(args[0])){
			
			var args_unsplit = "";
			var url;
			
			for (var i in args) {
				args_unsplit = args_unsplit + args[i] + " ";
			}
			
			//make search function
			if(args_unsplit.startsWith("http")){
				
				url = args_unsplit;
				
			} else {
				
				url = ytdl.searchYouTubeAsync(args_unsplit);
			}
			
			
			const songInfo = await ytdl.getInfo(url);
			console.log(songInfo.videoDetails.thumbnails);

			song = {
				type: 0,
				title: songInfo.videoDetails.title,
				url: songInfo.videoDetails.video_url,
				length: songInfo.videoDetails.lengthSeconds,
				timeleft: 0,
				author: songInfo.videoDetails.author.name,
				thumbnail: songInfo.videoDetails.thumbnails[0].url
			};
			
		} else {
			
			const search = await ytsr(args.join(" "), { pages: 1 });
			console.log(search.items);
			
			
			if (search.items.length == 0) return message.channel.send("No songs were found!");
			
			var found = false;
			
			await search.items.forEach(yt_item => {
				if(yt_item.type == "video" && !found){
					
					var a = yt_item.duration.split(':'); // split it at the colons
					var seconds = 0;
					if(a.length == 0){
						msg.channel.send("Please use a vailid time format(Example: 1:42)");
						return;
					} else if(a.length == 1){
						seconds = (a[0]); 
					} else if(a.length == 2){
						seconds = (+a[0]) * 60 + (+a[1]); 
					} else if(a.length == 3){
						seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]); 
					}

					console.log(yt_item.title);
					found = true;
					
					song = {
						type: 0,
						title: yt_item.title,
						url: yt_item.url,
						length: seconds,
						timeleft: 0,
						author: yt_item.author.name,
						thumbnail: yt_item.bestThumbnail.url
					};
				}
			});
			

		}

		console.log(song);
		if (!imports.MusicQueue.get(msg.guild.id)) {
			const queueContruct = {
				textChannel: msg.channel,
				voiceChannel: voiceChannel,
				connection: null,
				songs: [],
				volume: 50,
				playing: true,
			};

			imports.MusicQueue.set(msg.guild.id, queueContruct);
			queueContruct.songs.push(song);

			try {
				var connection = await voiceChannel.join();
				queueContruct.connection = connection;
				glofunc.PlaySong(msg.guild, queueContruct.songs[0]);
			} catch (err) {
				console.log(err);
				imports.MusicQueue.delete(msg.guild.id);
				msg.channel.send(err);
			}
		} else {
			const serverQueue = imports.MusicQueue.get(msg.guild.id);
			serverQueue.songs.push(song);
			msg.channel.send(":1234: The song ``" + song.title + "`` has been added to the queue.");
		}
		
		
		
		/*
		} else if(args[0].toString().includes("enthix")){
			var video_id = args[0].toString().split('v=')[1];
			var ampersandPosition = video_id.indexOf('&');
			
			if(ampersandPosition != -1) {
				video_id = video_id.substring(0, ampersandPosition);
			}
			
			msg.channel.send("[DEBUG] VIDEO_ID_PVIDEO_URL: 'https://enthix.net/video/uploads/" + video_id + ".mp4'");
			var connection = await voiceChannel.join();
			const dispatcher = connection.play('https://enthix.net/video/uploads/' + video_id + ".mp4");
			
		} else {
			msg.channel.send("Sorry, but we only support the following platforms:\nYoutube\nProject Video(UNFINISHED)");
		}*/
		
		

	},
	ModuleType: "command",
	Permissions: 0,
	CommandToggleWhitelist: true,
	CommandWhitelist: ["834518897549508649"],
	CommandRunGuild: true,
	CommandRunDM: false,
	CommandName: ["p", "play"]


};