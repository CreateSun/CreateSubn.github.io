---
title: selenium模拟12306登录
date: 2022-01-27 16:12:49
tags: [selenium,python]
toc: topics
---

```python 
import time

from selenium import webdriver
from lxml import etree
from selenium.webdriver import ActionChains, ChromeOptions as Options
from selenium.webdriver.common.by import By
js = 'return window.navigator.webdriver'
'''
    实现无可视化界面
'''
options = Options()
# options.add_argument('--headless')
# options.add_argument('--disable-gpu')
'''
    实现规避检测
'''
option_avoid = Options()
option_avoid.add_experimental_option('excludeSwitches', ['enable-automation'])
options.add_experimental_option('useAutomationExtension', False)
bro = webdriver.Chrome(chrome_options=options, options=option_avoid)
# 12306会通过获取window.navigator.webdriver属性判断是否为模拟浏览器
# 在加载阶段调用cdp(Chrome Devtool Protocol)抹掉该属性
bro.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
  "source": """
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    })
  """
})
bro.get('https://kyfw.12306.cn/otn/resources/login.html')
username_input = bro.find_element(By.ID, 'J-userName')
password_input = bro.find_element(By.ID, 'J-password')
username_input.send_keys('用户名xxxxx')
password_input.send_keys('密码xxxxx')
login_btn = bro.find_element(By.ID, 'J-login')
login_btn.click()
slide_modal = bro.find_element(By.ID, 'modal')
bro.execute_script('document.title ="测试"')
bro.execute_script('document.body.appendChild(document.createElement(\'div\'))')
time.sleep(2)
print(bro.execute_script(js))

with open('./login.html', 'w', encoding='utf-8') as fp:
    fp.write(bro.page_source)
while True:
    try:
        action = webdriver.ActionChains(bro)  # 利用行为链，持续按住并拖拽
        span = bro.find_element(By.ID, 'nc_1_n1z')  # 获取滑块
        action.drag_and_drop_by_offset(span, 330, 0).perform()  # 按住并拖动 >300px即可，选用330绰绰有余
        # action.click_and_hold(span).perform()
        # action.move_by_offset(xoffset=300,yoffset=0).perform() 另一张拖动
        action.release()  # 释放
        print(bro.execute_script(js))
        time.sleep(2)
        a = bro.find_element(By.ID, 'nc_1_refresh1')  # 查找刷新按钮，如果没有说明登录成功，执行except跳出循环
        a.click()  # 如果刚刚滑动失败，则点击刷新，重新滑动
        time.sleep(4)
    except Exception as e:
        print(e)
        break

```