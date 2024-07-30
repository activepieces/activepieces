import { MultiSelect, MultiSelectContent, MultiSelectGroup, MultiSelectItem, MultiSelectList, MultiSelectSearch, MultiSelectTrigger, MultiSelectValue } from '@/components/custom/multi-select';
import { useState } from 'react';


type MultiSelectOption = {
    label: string
    value: unknown
}

type MultiSelectPiecePropertyProps = {
    placeholder: string
    options: MultiSelectOption[]
    onChange: (value: unknown[]) => void
    initialValues: unknown[]
    disabled?: boolean
}

const MultiSelectPieceProperty = ({ placeholder, options, onChange, disabled, initialValues }: MultiSelectPiecePropertyProps) => {


    const selectedIndicies = initialValues.map((value) => String(options.findIndex(option => option.value === value))).filter(index => index !== undefined)
    const sendChanges = (indicides: string[]) => {
        const newSelectedIndicies = indicides.filter(index => index !== undefined)
        onChange(newSelectedIndicies.map(index => options[Number(index)].value))
    }


    return <MultiSelect value={selectedIndicies} onValueChange={sendChanges} disabled={disabled}>
        <MultiSelectTrigger className="w-full">
            <MultiSelectValue placeholder={placeholder} />
        </MultiSelectTrigger>
        <MultiSelectContent>
            <MultiSelectSearch />
            <MultiSelectList>
                {options.map((option, index) => (
                    <MultiSelectItem
                        key={index}
                        value={String(index)}>
                        {option.label}
                    </MultiSelectItem>
                ))}
            </MultiSelectList>
        </MultiSelectContent>
    </MultiSelect>
}

MultiSelectPieceProperty.displayName = 'MultiSelectPieceProperty'
export { MultiSelectPieceProperty }