import { SPACE_BETWEEN_ITEM_CONTENT_AND_LINE } from './draw-common'
import { Position } from './step-card'

type SvgOperation = {
    type: 'M'
    x: number
    y: number
} | {
    type: 'h' | 'v'
    delta: number
} | {
    type: 'arrow',
    content: string
}

export class SvgDrawer {
    private readonly operations: SvgOperation[] = []

    constructor(operations: SvgOperation[]) {
        this.operations = operations
    }
    
    static empty(): SvgDrawer {
        return new SvgDrawer([])
    }

    private positions(): Position[] {
        if (this.operations.length === 0) {
            return []
        }
        let currentPositionX = this.operations[0].type === 'M' ? this.operations[0].x : 0
        let currentPositionY = this.operations[0].type === 'M' ? this.operations[0].y : 0
        const positions: Position[] = []
        for (const operation of this.operations) {
            switch (operation.type) {
                case 'M':{
                    currentPositionX = operation.x
                    currentPositionY = operation.y
                    break
                }
                case 'h':{
                    currentPositionX += operation.delta
                    break
                }
                case 'v':{
                    currentPositionY += operation.delta
                    break
                }
                case 'arrow': {
                    break;
                }
            }
            positions.push({
                x: currentPositionX,
                y: currentPositionY,
            })
        }
        return positions
    }

    maximumX(): number {
        return this.positions().reduce((max, position) => Math.max(max, position.x), Number.MIN_SAFE_INTEGER)
    }

    minimumX(): number {
        return this.positions().reduce((min, position) => Math.min(min, position.x), Number.MAX_SAFE_INTEGER)
    }

    maximumY(): number {
        return this.positions().reduce((max, position) => Math.max(max, position.y), Number.MIN_SAFE_INTEGER)
    }

    minimumY(): number {
        return this.positions().reduce((min, position) => Math.min(min, position.y), Number.MAX_SAFE_INTEGER)
    }

    merge(child: SvgDrawer): SvgDrawer {
        return new SvgDrawer( [...this.operations, ...child.operations])
    }

    offset(dx: number, dy: number): SvgDrawer {
        return new SvgDrawer([...this.operations].map((value) => {
            if (value.type === 'M') {
                return {
                    ...value,
                    x: value.x + dx,
                    y: value.y + dy,
                }
            }
            return value
        }))
    }

    drawVerticalLine(dy: number): SvgDrawer {
        return new SvgDrawer([...this.operations, {
            type: 'v',
            delta: dy,
        }])
    }

    drawHorizontalLine(dx: number): SvgDrawer {
        return new SvgDrawer( [...this.operations, {
            type: 'h',
            delta: dx,
        }])
    }

    move(dx: number, dy: number): SvgDrawer {
        return new SvgDrawer([...this.operations, {
            type: 'M',
            x: dx,
            y: dy,
        }])
    }

    arrow(){
        return M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z
    }
    // Get the current SVG string
    toSvg(): { content: string } {
        return {
            content: this.operations.map((operation) => {
                switch (operation.type) {
                    case 'M': return `${operation.type} ${operation.x} ${operation.y}`
                    case 'h': return `${operation.type} ${operation.delta}`
                    case 'v': return `${operation.type} ${operation.delta}`
                }
            }).join(' '),
        }
    }
}

export function drawLine(from: Position, to: Position): SvgDrawer {
    const { x: startX, y: startY } = from
    const { x: endX, y: endY } = to
    const dx = endX - startX
    const dy = endY - startY - 2 * SPACE_BETWEEN_ITEM_CONTENT_AND_LINE
    const svgDrawer = SvgDrawer.empty().move(startX, startY + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE)
    if (startX === endX) {
        return svgDrawer.drawVerticalLine(dy - SPACE_BETWEEN_ITEM_CONTENT_AND_LINE)
    }
    return svgDrawer.drawVerticalLine(dy - 40 ).drawHorizontalLine(dx).drawVerticalLine(40 - SPACE_BETWEEN_ITEM_CONTENT_AND_LINE)
}

