export const BOT_LEVELS = {
  easy: { speed: 0.65, aimError: 0.38, attackRate: 1.5, dangerRadius: 45, dodge: false, recall: false },
  medium: { speed: 0.85, aimError: 0.12, attackRate: 3, dangerRadius: 85, dodge: true, recall: false },
  hard: { speed: 1, aimError: 0.025, attackRate: 5, dangerRadius: 130, dodge: true, recall: true }
};

export function botLevel(value) {
  return Object.hasOwn(BOT_LEVELS, value) ? value : 'medium';
}
