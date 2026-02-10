/**
 * 滴答清单风格的标签预设颜色
 */
export const TAG_PRESET_COLORS = [
  '#FF4D4F', // 红色
  '#FF7A45', // 橘红
  '#FFA940', // 橙色
  '#FFC53D', // 金色
  '#FFEC3D', // 黄色
  '#BAE637', // 石灰
  '#73D13D', // 绿色
  '#5CDBD3', // 青色
  '#40A9FF', // 蓝色
  '#597EF7', // 靛蓝
  '#9254DE', // 紫色
  '#F759AB', // 洋红
];

export const getRandomTagColor = () => {
  return TAG_PRESET_COLORS[Math.floor(Math.random() * TAG_PRESET_COLORS.length)];
};
