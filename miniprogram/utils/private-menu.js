// 周鹏私房菜 · 隐藏菜单（50 道北方风味）
// 鄂尔多斯蒙式 + 巴彦淖尔河套 + 东北菜
const PRIVATE_MENU = [
  {
    cat: '鄂尔多斯 · 蒙式风味',
    icon: '🏔️',
    dishes: [
      { name: '阿尔巴斯风干羊肉' },
      { name: '手扒肉' },
      { name: '红葱炖羊肉' },
      { name: '烤全羊' },
      { name: '烤羊排' },
      { name: '烤羊腿' },
      { name: '砂锅羊杂' },
      { name: '血肠' },
      { name: '肉肠' },
      { name: '蒙古馅饼' },
      { name: '蒙古奶茶' },
      { name: '牧区酸奶' },
      { name: '拔丝奶皮' }
    ]
  },
  {
    cat: '巴彦淖尔 · 河套风味',
    icon: '🌾',
    dishes: [
      { name: '巴盟烩酸菜' },
      { name: '猪肉勾鸡' },
      { name: '腌猪肉烩菜' },
      { name: '巴盟酿皮', spicy: true },
      { name: '河套铁锅焖面' },
      { name: '干羊肉焖面' },
      { name: '油烙饼' },
      { name: '酸粥' },
      { name: '烧猪肉' },
      { name: '羊肉丸子' },
      { name: '酥鸡' },
      { name: '洋汤烩菜' },
      { name: '黄豆芽拌沙盖', spicy: true }
    ]
  },
  {
    cat: '东北 · 硬菜',
    icon: '🍖',
    dishes: [
      { name: '锅包肉' },
      { name: '杀猪菜' },
      { name: '小鸡炖蘑菇' },
      { name: '猪肉炖粉条' },
      { name: '铁锅炖大鹅' },
      { name: '得莫利炖鱼' },
      { name: '酸菜白肉' },
      { name: '地三鲜' },
      { name: '溜肉段' },
      { name: '酱骨架' },
      { name: '雪衣豆沙' },
      { name: '拔丝地瓜' },
      { name: '酸菜粉' }
    ]
  },
  {
    cat: '凉菜 · 主食 · 小食',
    icon: '🥟',
    dishes: [
      { name: '凉拌沙盖', spicy: true },
      { name: '河套烂腌菜' },
      { name: '黄瓜拉皮' },
      { name: '蒜泥白肉', spicy: true },
      { name: '大碴粥' },
      { name: '粘豆包' },
      { name: '冻梨' },
      { name: '韭菜盒子' },
      { name: '玉米面贴饼子' },
      { name: '蒙古炒米' },
      { name: '华莱士瓜' }
    ]
  }
]

function allPrivateDishes() {
  const list = []
  PRIVATE_MENU.forEach(function (cat) {
    cat.dishes.forEach(function (dish) {
      list.push(dish.name)
    })
  })
  return list
}

module.exports = {
  PRIVATE_MENU: PRIVATE_MENU,
  allPrivateDishes: allPrivateDishes
}
