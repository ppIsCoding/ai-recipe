/**
 * 菜谱卡片组件
 * 展示菜谱信息，包括图片、名称、描述、标签等
 */
Component({
  properties: {
    // 菜谱数据
    recipe: {
      type: Object,
      value: {}
    }
  },

  methods: {
    // 点击事件
    onTap: function () {
      this.triggerEvent('tap', { id: this.properties.recipe.id })
    }
  }
})
