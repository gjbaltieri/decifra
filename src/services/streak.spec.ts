import { calculateWinStreak } from "./streak";

describe("calculateWinStreak (regra de dias consecutivos)", () => {
    const TODAY = "2026-11-25";

    it("retorna 0 quando o usuário não possui partidas", () => {
        expect(calculateWinStreak([], TODAY)).toEqual({
            currentStreak: 0,
            bestStreak: 0,
        });
    });

    it("conta hoje + dias anteriores consecutivos quando venceu hoje", () => {
        const result = calculateWinStreak(
            [
                { date: "2026-11-25", status: "won" },
                { date: "2026-11-24", status: "won" },
                { date: "2026-11-23", status: "won" },
                { date: "2026-11-22", status: "lost" },
            ],
            TODAY
        );

        expect(result).toEqual({ currentStreak: 3, bestStreak: 3 });
    });

    it("zera a sequência quando um dia é pulado entre vitórias", () => {
        const result = calculateWinStreak(
            [
                { date: "2026-11-25", status: "won" },
                // 2026-11-24 pulado!
                { date: "2026-11-23", status: "won" },
                { date: "2026-11-22", status: "won" },
                { date: "2026-11-21", status: "won" },
            ],
            TODAY
        );

        expect(result).toEqual({ currentStreak: 1, bestStreak: 3 });
    });

    it("zera a sequência atual quando perdeu no dia atual mesmo tendo vencido ontem", () => {
        const result = calculateWinStreak(
            [
                { date: "2026-11-25", status: "lost" },
                { date: "2026-11-24", status: "won" },
                { date: "2026-11-23", status: "won" },
            ],
            TODAY
        );

        expect(result).toEqual({ currentStreak: 0, bestStreak: 2 });
    });

    it("mantém a sequência ativa quando ainda não jogou hoje mas venceu ontem", () => {
        const result = calculateWinStreak(
            [
                { date: "2026-11-24", status: "won" },
                { date: "2026-11-23", status: "won" },
                { date: "2026-11-22", status: "won" },
            ],
            TODAY
        );

        expect(result).toEqual({ currentStreak: 3, bestStreak: 3 });
    });

    it("mantém a sequência ativa quando a partida de hoje está em andamento (playing) e venceu ontem", () => {
        const result = calculateWinStreak(
            [
                { date: "2026-11-25", status: "playing" },
                { date: "2026-11-24", status: "won" },
                { date: "2026-11-23", status: "won" },
            ],
            TODAY
        );

        expect(result).toEqual({ currentStreak: 2, bestStreak: 2 });
    });

    it("zera a sequência quando não jogou hoje nem ontem (lacuna de 1 dia)", () => {
        const result = calculateWinStreak(
            [
                { date: "2026-11-23", status: "won" },
                { date: "2026-11-22", status: "won" },
            ],
            TODAY
        );

        expect(result).toEqual({ currentStreak: 0, bestStreak: 2 });
    });

    it("funciona corretamente na virada de mês e ano", () => {
        const result = calculateWinStreak(
            [
                { date: "2027-01-02", status: "won" },
                { date: "2027-01-01", status: "won" },
                { date: "2026-12-31", status: "won" },
                { date: "2026-12-30", status: "won" },
            ],
            "2027-01-02"
        );

        expect(result).toEqual({ currentStreak: 4, bestStreak: 4 });
    });
});
