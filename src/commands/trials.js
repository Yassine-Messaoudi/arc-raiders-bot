const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { trialsGuide } = require('../data/meta.js');
const { getCachedData, updateCachedData, fetchWeeklyTrialsFromWiki } = require('../services/dataFetcher.js');

function youtubeSearchUrl(query) {
    const q = encodeURIComponent(String(query || '').trim());
    return `https://www.youtube.com/results?search_query=${q}`;
}

function createTrialsLinkRows(weekly) {
    const trials = Array.isArray(weekly?.trials) ? weekly.trials.slice(0, 5) : [];
    if (!trials.length) return [];

    const wikiRow = new ActionRowBuilder();
    const ytRow = new ActionRowBuilder();

    trials.forEach((t, idx) => {
        const wikiUrl = t?.url || weekly?.sourceUrl || null;
        const ytUrl = youtubeSearchUrl(`ARC Raiders ${String(t?.title || '').trim()} trial guide`);

        if (wikiUrl) {
            wikiRow.addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setLabel(`Wiki ${idx + 1}`)
                    .setURL(wikiUrl)
            );
        }

        ytRow.addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel(`YT ${idx + 1}`)
                .setURL(ytUrl)
        );
    });

    const rows = [];
    if (wikiRow.components.length) rows.push(wikiRow);
    if (ytRow.components.length) rows.push(ytRow);
    return rows;
}

function getTrialTips(title) {
    const t = String(title || '').toLowerCase();
    if (!t) return [];

    if (t.includes('damage snitches')) {
        return [
            'Focus on Snitch hotspots and farm them early (don’t wait until late raids).',
            'Bring consistent DPS and ammo; avoid long PvP fights if you’re only chasing points.'
        ];
    }

    if (t.includes('damage bastions')) {
        return [
            'Bastions are safest to farm when you can isolate them from players.',
            'Bring high DPS (LMG/AR) and enough meds; prioritize damage uptime over looting.'
        ];
    }

    if (t.includes('search supply drops') || t.includes('supply drop')) {
        return [
            'Rotate between known drop areas and listen for fights—drops attract squads.',
            'Grab + leave: don’t over-stay, extract and repeat for faster completion.'
        ];
    }

    if (t.includes('harvest plants') || t.includes('plants')) {
        return [
            'Route a plant-dense area and farm in a loop; avoid “high traffic” PvP zones.',
            'Split tasks in squad: one harvests while others scout.'
        ];
    }

    if (t.includes('damage rocketeers')) {
        return [
            'Use cover and peek damage; Rocketeers punish open ground.',
            'Tag-and-rotate: get damage then reposition to avoid rockets.'
        ];
    }

    if (t.includes('download') && t.includes('data')) {
        return [
            'Clear the area first, then start the objective; expect player third-parties.',
            'Run smoke/utility and assign one teammate to hold angles.'
        ];
    }

    return [
        'Stack this trial with other objectives in the same raid to maximize points/hour.',
        'If progress is slow, switch maps/routes and prioritize safe extractions.'
    ];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trials')
        .setDescription('Weekly Trials + ranked tips')
        .addSubcommand(sub =>
            sub
                .setName('week')
                .setDescription('This week’s 5 trials + tips + YouTube links')
        )
        .addSubcommand(sub =>
            sub
                .setName('tips')
                .setDescription('General Trials tips to rank up faster')
        )
        .addSubcommand(sub =>
            sub
                .setName('fastrank')
                .setDescription('Fast rank methods (best points/hour)')
        )
        .addSubcommand(sub =>
            sub
                .setName('ranks')
                .setDescription('Rank unlocks and progression info')
        ),
    
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'week') {
            const cache = getCachedData();
            let weekly = cache?.trials || null;

            const isStale = (iso) => {
                if (!iso) return true;
                const t = new Date(iso).getTime();
                if (!Number.isFinite(t)) return true;
                return Date.now() - t > 30 * 60 * 1000;
            };

            if (!weekly?.trials?.length || isStale(weekly?.lastUpdated)) {
                try {
                    const fresh = await fetchWeeklyTrialsFromWiki();
                    if (fresh?.trials?.length) {
                        updateCachedData((d) => {
                            d.trials = fresh;
                        });
                        weekly = fresh;
                    }
                } catch (e) {
                    // ignore and use existing cache if present
                }
            }

            if (!weekly?.trials?.length) {
                await interaction.reply({
                    content: 'No weekly Trials found yet. Keep the bot running for ~30 seconds so it can auto-scrape the Trials wiki, then try again.',
                    ephemeral: true
                });
                return;
            }

            const header = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('🏆 Weekly Trials (Ranked)')
                .setDescription([
                    `**${weekly.weekLabel || 'Current Trial Week'}**`,
                    weekly.sourceUrl ? `[Source: ARC Raiders Wiki](${weekly.sourceUrl})` : null
                ].filter(Boolean).join('\n'))
                .setTimestamp();

            if (weekly.image) {
                header.setThumbnail(weekly.image);
            }

            const trialEmbeds = weekly.trials.slice(0, 5).map((trial, idx) => {
                const title = String(trial.title || '').trim();
                const tips = getTrialTips(title);
                const e = new EmbedBuilder()
                    .setColor(0x313338)
                    .setTitle(`${idx + 1}. ${title || 'Trial'}`);

                if (trial.url) e.setURL(trial.url);
                if (trial.image) e.setThumbnail(trial.image);

                e.setDescription([
                    '**Quick tips:**',
                    ...tips.map(t => `- ${t}`)
                ].join('\n'));

                return e;
            });

            const points = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('⚡ Max Points Fast')
                .setDescription([
                    '- Prioritize the fastest 2-3 trials first (repeatable routes).',
                    '- Stack multiple trials in one raid (plan route before drop).',
                    '- Extract often: more completions per hour beats “one perfect run”.'
                ].join('\n'));

            const rows = createTrialsLinkRows(weekly);

            await interaction.reply({
                embeds: [header, ...trialEmbeds, points],
                components: rows
            });
            return;
        }

        if (sub === 'tips') {
            const embed = new EmbedBuilder()
                .setColor(0x9933FF)
                .setTitle('💡 Trials Ranking Tips')
                .setDescription('Best tips to level up fast in ARC Raiders')
                .addFields({
                    name: '🎯 Top Tips',
                    value: trialsGuide.tips.join('\n\n'),
                    inline: false
                })
                .setFooter({ text: 'Use /trials fastrank for points/hour methods' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (sub === 'fastrank') {
            const embeds = trialsGuide.fastRank.map((method, index) => {
                const colors = [0x00FF00, 0xFFFF00, 0xFF6600];
                return new EmbedBuilder()
                    .setColor(colors[index] || 0x00AAFF)
                    .setTitle(`⚡ ${method.method}`)
                    .setDescription(method.description)
                    .addFields(
                        { name: '📈 XP Rate', value: method.xpPerHour, inline: true },
                        { name: '📋 Steps', value: method.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'), inline: false }
                    )
                    .setTimestamp();
            });

            await interaction.reply({
                content: '## ⚡ Fast Ranking Methods - Sorted by XP/Hour',
                embeds: embeds
            });
            return;
        }

        if (sub === 'ranks') {
            const rankList = trialsGuide.ranks
                .map(r => `**Rank ${r.rank}** (${r.xpNeeded.toLocaleString()} XP) → ${r.unlock}`)
                .join('\n');

            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('📊 Rank Progression & Unlocks')
                .setDescription(rankList)
                .addFields({
                    name: '💡 Tip',
                    value: 'Focus on reaching Rank 10 first for SMGs - they dominate early game!',
                    inline: false
                })
                .setFooter({ text: 'Use /trials fastrank to level up quickly' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};
