"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkGuess_1 = require("./checkGuess");
describe('checkGuess', () => {
    it('deve retornar todas as posições como correct em caso de acerto exato', () => {
        // Arrange
        const secret = 'TERMO';
        const guess = 'TERMO';
        // Act
        const result = (0, checkGuess_1.checkGuess)(secret, guess);
        // Assert
        expect(result).toEqual([
            'correct',
            'correct',
            'correct',
            'correct',
            'correct',
        ]);
    });
    it('deve retornar todas as posições como absent quando nenhuma letra existe na palavra secreta', () => {
        // Arrange
        const secret = 'TERMO';
        const guess = 'PULGA';
        // Act
        const result = (0, checkGuess_1.checkGuess)(secret, guess);
        // Assert
        expect(result).toEqual([
            'absent',
            'absent',
            'absent',
            'absent',
            'absent',
        ]);
    });
    it('deve retornar mistura de correct, present e absent corretamente', () => {
        // Arrange
        const secret = 'TERMO';
        const guess = 'TEMPO';
        // Act
        const result = (0, checkGuess_1.checkGuess)(secret, guess);
        // Assert
        expect(result).toEqual([
            'correct',
            'correct',
            'present',
            'absent',
            'correct',
        ]);
    });
    it('deve ignorar diferenças entre maiúsculas e minúsculas (case-insensitive)', () => {
        // Arrange
        const secret = 'TeRmO';
        const guess = 'tEmPo';
        // Act
        const result = (0, checkGuess_1.checkGuess)(secret, guess);
        // Assert
        expect(result).toEqual([
            'correct',
            'correct',
            'present',
            'absent',
            'correct',
        ]);
    });
    describe('letra repetida no palpite quando a palavra secreta tem apenas uma ocorrência', () => {
        it('deve marcar como absent a repetição que aparece depois do acerto exato', () => {
            // Arrange
            const secret = 'TERMO';
            const guess = 'CARRO';
            // Act
            const result = (0, checkGuess_1.checkGuess)(secret, guess);
            // Assert
            expect(result).toEqual([
                'absent',
                'absent',
                'correct',
                'absent',
                'correct',
            ]);
        });
        it('deve marcar como absent a repetição que aparece antes do acerto exato, priorizando o correct', () => {
            // Arrange
            const secret = 'TERMO';
            const guess = 'RARAS';
            // Act
            const result = (0, checkGuess_1.checkGuess)(secret, guess);
            // Assert
            expect(result).toEqual([
                'absent',
                'absent',
                'correct',
                'absent',
                'absent',
            ]);
        });
        it('deve marcar apenas a primeira ocorrência como present quando nenhuma está na posição exata', () => {
            // Arrange
            const secret = 'TERMO';
            const guess = 'ARARA';
            // Act
            const result = (0, checkGuess_1.checkGuess)(secret, guess);
            // Assert
            expect(result).toEqual([
                'absent',
                'present',
                'absent',
                'absent',
                'absent',
            ]);
        });
    });
    describe('letras repetidas tanto na palavra secreta quanto no palpite', () => {
        it('deve contabilizar corretamente múltiplas ocorrências combinando correct e present (CASAS vs ASSAR)', () => {
            // Arrange
            const secret = 'CASAS';
            const guess = 'ASSAR';
            // Act
            const result = (0, checkGuess_1.checkGuess)(secret, guess);
            // Assert
            expect(result).toEqual([
                'present',
                'present',
                'correct',
                'correct',
                'absent',
            ]);
        });
        it('deve marcar excedentes como absent quando o palpite tem mais repetições do que a palavra secreta', () => {
            // Arrange
            const secret = 'CASAS';
            const guess = 'AAAAA';
            // Act
            const result = (0, checkGuess_1.checkGuess)(secret, guess);
            // Assert
            expect(result).toEqual([
                'absent',
                'correct',
                'absent',
                'correct',
                'absent',
            ]);
        });
    });
});
