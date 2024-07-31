require("dotenv").config()
const { Client, IntentsBitField,  ActionRowBuilder, TextInputBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputStyle, Events, EmbedBuilder, GatewayIntentBits, REST, Routes   } = require('discord.js');
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.DirectMessages,
  ],
});

//the bot's clientId
const clientId = "1100069533512896593"
//serverId
const guildId = "1062412160220799099"
//name of the channel with the verification button
const channelName = 'verification'
//channelId to react with a cross-emoji
const channelIdCross = "1062412161135161437"
//channelId to react with a hook-emoji
const channelIdHook = "1062412161734938634"
//role, which should be added by verification
const roleName = "top"
//channelId for successful verification
const channelId1 = '1196059817417117777';
//channelId for failed verification
const channelId2 = '1196060106891198584';
//channelId for people, who tried to verify a second time
const channelId3 = '1196094543460827246';
//password for the verification inputfield
const password = "12345678"

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!'
    },
    {
        name: 'hello',
        description: 'Replies with Hello!'
    },
    {
        name: 'verification',
        description: 'Create a verification-message',
        default_member_permissions: 8
    }
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once("ready", () => {
    console.log(`Ready! Logged in as ${client.user.tag}! I'm on ${client.guilds.cache.size}`);
    client.user.setActivity({name:"mit dem Code", type:"PLAYING"});
});

client.once('guildMemberAdd', (member) => {
    const welcomeChannel = member.guild.channels.cache.find(channel => channel.name === 'willkommen');
  
    if (!welcomeChannel) return;

    welcomeChannel.send(`Willkommen, ${member.user.tag}, auf unserem Server!`);

});

//nachricht mit dem inhalt abcd schreiben, damit das verification-system gestartet wird. !!!es muss einen channel mit dem namen verification geben
client.once('messageCreate', (message) => {
    if(message.author.bot) return;
    console.log(message.author.tag);  

    if(message.channel.id == channelIdCross){
        message.react("❌")
    }else if(message.channel.id == channelIdHook){
        message.react("✅")
    }
});

client.on('interactionCreate', async (interaction) => {
    if(interaction.isButton()){

        const { customId, user } = interaction;
    
        if(customId === 'verify'){
    
            const modal = new ModalBuilder()
                .setCustomId('myModal')
                .setTitle('Verification');
    
                const textInput = new TextInputBuilder({
                    custom_id: 'text',
                    label: 'Please enter the Password to verify!',
                    style: TextInputStyle.Short,
                });
    //in die klammern die länge des passworts eingeben
                textInput.setMaxLength(8);
                textInput.setPlaceholder(password);
    
            const row = new ActionRowBuilder().addComponents(textInput);
            modal.addComponents(row);
            await interaction.showModal(modal);
        }
        
    }else if (interaction.isCommand()){

        const { commandName } = interaction;
    
        console.log(commandName)
    
        if (commandName === 'ping') {
            await interaction.reply('Pong!');
        } else if (commandName === 'hello') {
            await interaction.reply(`Hello, ${interaction.user.username}!`);
        }else if(commandName == 'verification'){
            const guild1 = interaction.guild;
    
            const channel = guild1.channels.cache.find(ch => ch.name === channelName);

            const messages = await channel.messages.fetch({ limit: 1 });

            if (messages.size > 0) {
                interaction.reply(`There are already messages in the verifiaction channel!`)
            } else {
    
                const button = new ButtonBuilder()
                    .setCustomId('verify')
                    .setLabel('Verify')
                    .setStyle(ButtonStyle.Primary)
        
                const row = new ActionRowBuilder()
                    .addComponents(button);
        
                try {
                    channel.send({
                        content: 'Please verify!',
                        components: [row],
                    });
                    interaction.reply(`Verification Button was successfully created!`)
                    console.log(`Nachricht mit Button in ${channel.name} gesendet.`);
                } catch (error) {
                    interaction.reply(`Sorry! Something went wrong...`)
                    console.error(`Fehler beim Senden der Nachricht in ${channel.name}: ${error.message}`);
                }
            }
        }
        
    }
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isModalSubmit()) return;
    const { customId, user } = interaction;

    const speicher = client.guilds.cache.get(guildId);
    if(!speicher) return "puhno"

    const guild = interaction.guild;
    if(!guild) return "Server nicht gefunden!"

    const member = guild.members.cache.find(member => member.user.username === user.tag);
    if (!member) return console.error('Member nicht gefunden');

    var hasRole = true;

    const userRoles = member.roles.cache.find(role => role.name === roleName);
    if (!userRoles) hasRole = false;

    //in die anführungszeichen das passwort eingeben
    if(interaction.fields.getTextInputValue('text') == password && customId === "myModal" && !hasRole){
        await interaction.deferReply({ ephemeral: true });

        const role = guild.roles.cache.find(role => role.name === roleName);
        if (!role) return console.error('Rolle nicht gefunden.');

        member.roles.add(role)
            .then(() => {
                console.log(`Benutzer ${member.user.tag} wurde die Rolle ${role.name} zugewiesen.`);
            })
            .catch((error) => {
                console.error('Fehler beim Zuweisen der Rolle:', error);
            });

        const channel = guild.channels.cache.get(channelId1);
        if(!channel) return "verified Channel nicht gefunden.";

        channel.send(member.user.globalName + " successfully verified!");

        await interaction.editReply({
            content: 'Verification was successful!',
            components: [],
          });
    }else if(customId === "myModal" && hasRole){
        await interaction.deferReply({ ephemeral: true });

        const channel = guild.channels.cache.get(channelId3);
        if(!channel) return "already-verified Channel nicht gefunden.";

        channel.send(member.user.globalName + " tried to verify himself, although he is already 'top'!");

        await interaction.editReply({
            content: 'You are already verified!',
            components: [],
          });
    //in die anführungszeichen das passwort eingeben
    }else if(customId === "myModal" && !(interaction.fields.getTextInputValue('text') == password)){
        await interaction.deferReply({ ephemeral: true });

        const channel = guild.channels.cache.get(channelId2);
        if(!channel) return "verification-failed Channel nicht gefunden.";

        channel.send(member.user.globalName + " tried to verify with the wrong password!");

        await interaction.editReply({
            content: 'Wrong password!!!',
            components: [],
          });
    }else{
        await interaction.deferReply({ ephemeral: true });

        await interaction.editReply({
            content: 'We are sorry, something went wrong...',
            components: [],
          });
    }
});
//token in die klammern
client.login(process.env.DISCORD_TOKEN;);
