/**
 * 简易 Markdown → HTML 转换器
 * 用于微信小程序 rich-text 组件渲染
 */

/**
 * 将 markdown 文本转换为 HTML
 * @param {string} md - markdown 文本
 * @returns {string} HTML 字符串
 */
function markdownToHtml(md) {
  if (!md) return ''

  var html = md

  // 转义 HTML 特殊字符（但保留后续生成的标签）
  html = html.replace(/&/g, '&amp;')
  html = html.replace(/</g, '&lt;')
  html = html.replace(/>/g, '&gt;')

  // 标题 ### / ## / #
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>')

  // 加粗 **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 斜体 *text*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:24rpx;">$1</code>')

  // 无序列表 - item 或 * item
  html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')

  // 有序列表 1. item
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

  // 将连续 <li> 包裹为 <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul style="padding-left:32rpx;margin:8rpx 0;">$1</ul>')

  // 换行处理：连续两个换行变为段落分隔
  html = html.replace(/\n\n+/g, '</p><p style="margin:12rpx 0;">')

  // 单个换行变为 <br>
  html = html.replace(/\n/g, '<br/>')

  // 包裹在段落中
  html = '<p style="margin:0;">' + html + '</p>'

  // 清理空段落
  html = html.replace(/<p[^>]*><\/p>/g, '')

  return html
}

module.exports = {
  markdownToHtml: markdownToHtml
}
