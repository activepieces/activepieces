

export function TextWithIcon({ icon, text, className }: { icon: React.ReactNode, text: string, className?: string }) {
    return (
        <div className={`flex items-center ${className}`}>
            {icon}
            <span className="ml-2">{text}</span>
        </div>
    )
}