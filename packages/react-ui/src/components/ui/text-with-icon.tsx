

export function TextWithIcon({ icon, text, className }: { icon: React.ReactNode, text: string, className?: string }) {
    return (
        <div className={`ap-flex ap-items-center ${className}`}>
            {icon}
            <span className="ap-ml-2">{text}</span>
        </div>
    )
}