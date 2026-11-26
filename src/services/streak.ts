export type StreakGameStatus = "playing" | "won" | "lost";

export interface StreakGameRecord {
    date: string; // Formato 'YYYY-MM-DD'
    status: StreakGameStatus;
}

export interface StreakSummary {
    currentStreak: number;
    bestStreak: number;
}

const MS_PER_DAY = 86_400_000;

function parseIsoDateToUtcMs(dateStr: string): number | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return Date.UTC(year, month - 1, day);
}

function formatUtcMsToIsoDate(ms: number): string {
    const d = new Date(ms);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export function addDaysToIsoDate(dateStr: string, deltaDays: number): string {
    const ms = parseIsoDateToUtcMs(dateStr);
    if (ms === null) return dateStr;
    return formatUtcMsToIsoDate(ms + deltaDays * MS_PER_DAY);
}

/**
 * Calcula a sequência atual (currentStreak) e a maior sequência (bestStreak)
 * de vitórias em dias corridos consecutivos com base em `words.date`.
 *
 * Regras:
 * - Pular um dia (sem registro `won`) zera a sequência.
 * - Vitória hoje (`words.date === todayDate && status === 'won'`): conta hoje + dias anteriores consecutivos vencidos.
 * - Derrota hoje (`words.date === todayDate && status === 'lost'`): `currentStreak = 0`.
 * - Sem partida hoje ou partida hoje em andamento (`status === 'playing'`): conta a partir de ontem (`todayDate - 1`).
 */
export function calculateWinStreak(
    records: StreakGameRecord[],
    todayDate: string
): StreakSummary {
    if (records.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
    }

    const statusByDate = new Map<string, StreakGameStatus>();
    for (const record of records) {
        if (parseIsoDateToUtcMs(record.date) === null) continue;
        statusByDate.set(record.date, record.status);
    }

    // 1. Sequência atual (currentStreak)
    const todayStatus = statusByDate.get(todayDate);
    let currentStreak = 0;

    if (todayStatus !== "lost") {
        let cursor =
            todayStatus === "won" ? todayDate : addDaysToIsoDate(todayDate, -1);

        while (statusByDate.get(cursor) === "won") {
            currentStreak += 1;
            cursor = addDaysToIsoDate(cursor, -1);
        }
    }

    // 2. Maior sequência histórica (bestStreak)
    const wonDates = Array.from(statusByDate.entries())
        .filter(([, status]) => status === "won")
        .map(([date]) => date)
        .sort();

    let bestStreak = 0;
    let runningStreak = 0;
    let prevDate: string | null = null;

    for (const date of wonDates) {
        if (prevDate !== null && date === addDaysToIsoDate(prevDate, 1)) {
            runningStreak += 1;
        } else {
            runningStreak = 1;
        }
        if (runningStreak > bestStreak) {
            bestStreak = runningStreak;
        }
        prevDate = date;
    }

    return { currentStreak, bestStreak };
}
