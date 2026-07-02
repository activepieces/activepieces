import { z } from 'zod'

export enum TableColor {
    GRAY = 'GRAY',
    RED = 'RED',
    ORANGE = 'ORANGE',
    AMBER = 'AMBER',
    GREEN = 'GREEN',
    TEAL = 'TEAL',
    BLUE = 'BLUE',
    INDIGO = 'INDIGO',
    PURPLE = 'PURPLE',
    PINK = 'PINK',
}

export const TableColorSchema = z.enum(TableColor)
