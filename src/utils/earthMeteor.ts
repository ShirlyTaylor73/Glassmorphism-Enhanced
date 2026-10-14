export interface EarthMeteorColors {
  tail: string
  body: string
  head: string
}

export function getEarthMeteorColors(isDark: boolean, index: number): EarthMeteorColors {
  const darkPalettes: EarthMeteorColors[] = [
    {
      tail: 'rgba(14, 165, 233, 0.02)',
      body: 'rgba(56, 189, 248, 0.86)',
      head: 'rgba(224, 242, 254, 1)',
    },
    {
      tail: 'rgba(217, 119, 6, 0.02)',
      body: 'rgba(245, 158, 11, 0.88)',
      head: 'rgba(254, 240, 138, 1)',
    },
    {
      tail: 'rgba(109, 40, 217, 0.02)',
      body: 'rgba(139, 92, 246, 0.8)',
      head: 'rgba(103, 232, 249, 1)',
    },
  ]
  const lightPalettes: EarthMeteorColors[] = [
    {
      tail: 'rgba(3, 105, 161, 0.08)',
      body: 'rgba(3, 105, 161, 0.96)',
      head: 'rgba(14, 116, 144, 1)',
    },
    {
      tail: 'rgba(180, 83, 9, 0.08)',
      body: 'rgba(180, 83, 9, 0.96)',
      head: 'rgba(194, 65, 12, 1)',
    },
    {
      tail: 'rgba(91, 33, 182, 0.08)',
      body: 'rgba(109, 40, 217, 0.96)',
      head: 'rgba(15, 118, 110, 1)',
    },
  ]

  return (isDark ? darkPalettes : lightPalettes)[index % 3]!
}
