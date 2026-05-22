import Image from 'next/image'

interface TeamFlagProps {
  iso: string
  name: string
  size?: number
  className?: string
}

export function TeamFlag({ iso, name, size = 40, className = '' }: TeamFlagProps) {
  const url = `https://flagcdn.com/w${size <= 40 ? 40 : 80}/${iso.toLowerCase()}.png`
  return (
    <Image
      src={url}
      alt={`Bandera de ${name}`}
      width={size}
      height={Math.round(size * 0.67)}
      className={`rounded-sm object-cover shadow-sm ${className}`}
      unoptimized
    />
  )
}
