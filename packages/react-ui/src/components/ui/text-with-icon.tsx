

export function TextWithIcon({ icon, text, className }: { icon: React.ReactNode, text: React.ReactNode, className?: string }) {
    return (
        <div className={`flex items-center ${className}`}>
            {icon}
            <span className="ml-2">{text}</span>
        </div>
    )
}