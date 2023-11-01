---
title: vue-双向数据绑定
date: 2022-05-04 17:49:19
updated: 2022-05-04 17:49:19
categories: 前端
tags: [前端, vue]
toc: true
cover: /images/12138.jpg
---
> 参考B站up蛋老师是的视频学习了一下vue的双向数据绑定以及模板解析的操作，实在是太巧妙了！[视频地址](https://www.bilibili.com/video/BV1934y1a7MN?share_source=copy_web)

&emsp;&emsp;直接放代码，前端部分，参考vue的写法，这里的data是一个普通的对象，vue官网的data是一个函数，官方的写法应该是为了数据绑定做出的优化，但是没有了解过相关原理，所有暂时还不太理解二者的区别。
``` HTML
<body>
    <div id="app">
        <label>用户名：
            <input v-model="name" type="text" name="username" id="username">
        </label><br>
        <label>年&emsp;龄：
            <input v-model="info.age" type="text" name="age" id="age">
        </label><br>
        <label>身&emsp;高：
            <input v-model="info.height" type="text" name="height" id="height">
        </label>
        <p> 用户名： {{ name }} </p>
        <p>年龄： {{info.age}}</p>
        <p>身高： {{info.height}}cm</p>
    </div>
</body>
<script src="./vue.js"></script>
<script>
    const vm = new Vue({
        el: "#app",
        data: {
            name: "啦啦啦种太阳",
            info: {
                age: 18,
                height: 170
            }
        }
    })
</script>
```
**HTML部分参考官方的写法，本次的demo主要实现文本渲染、输入框的v-model监听，以及数据绑定**

JS部分
``` JavaScript
// vue.js
class Vue {
    constructor({el, data}) {
        this.$el = el
        this.$data = data
        Observer(this.$data)
        Compile(el, this)
    }
}

// 为数据绑定监听者
function Observer(data_instance) {
    if(!data_instance || typeof data_instance !==  'object') return;
    const dependency = new Dependency();
    Object.keys(data_instance).forEach(key => {
        let value = data_instance[key]
        Observer(value)
        Object.defineProperty(data_instance, key, {
            enumerable: true,
            configurable: true,
            get() {
                console.log(`访问了属性：${key} -> 值 ${value}`)
                Dependency.temp && dependency.addSub(Dependency.temp)
                if(Dependency.temp) console.log(Dependency.temp)
                return value;
            },
            set(newValue) {
                console.log(`属性${key}的值"${value}"修改为 -> "${newValue}"`)
                value = newValue
                Observer(newValue)
                dependency.notify()
            }
        })
    })
}

// 模板解析
function Compile(element, vm) {
    vm.$el = document.querySelector(element);
    const fragment = document.createDocumentFragment();
    let child;
    while(child = vm.$el.firstChild) {
        fragment.append(child)
    }
    fragment_compile(fragment)
    function fragment_compile(node) {
        const pattern = /\{\{\s*(\S+)\s*\}\}/
        if(node.nodeType === 3) {
            const xxx = node.nodeValue
            const result = pattern.exec( node.nodeValue)
            if(result) {
                const arr = result[1].split(".")
                const value = arr.reduce((total, current) => total[current], vm.$data)
                node.nodeValue = xxx.replace(pattern, value)
                new Watcher(vm, result[1], newValue => {
                    node.nodeValue = xxx.replace(pattern, newValue)
                })
            }
            return 
        } 
        // 实现input框的v-model属性绑定
        if(node.nodeType === 1 && node.nodeName === "INPUT") {
            const attr = Array.from(node.attributes)
            attr.forEach(i => {
                if(i.nodeName === 'v-model') {
                    const value = i.nodeValue.split(".").reduce(
                        (total, current) => total[current], vm.$data
                    )
                    node.value = value
                    new Watcher(vm, i.nodeValue, newValue => {
                        node.value = newValue
                    })
                    node.addEventListener('input', e => {
                        let name = i.nodeValue.split(".");
                        const final = name.slice(0, name.length - 1).reduce(
                            (total, current) => total[current], vm.$data
                        )
                        final[name[name.length - 1]] = e.target.value
                    })
                }
            })
        }
        node.childNodes.forEach(child => fragment_compile(child))
    }
    vm.$el.append(fragment)
}

/**发布订阅模式 */
class Dependency {
    temp = null
    constructor() {
        this.subscriber = []
    }
    addSub(sub) {
        this.subscriber.push(sub)
    }
    notify() {
        this.subscriber.forEach(sub => sub.update())
    }
}

// 观察者
class Watcher {
    constructor(vm, key, callback) {
        this.vm = vm
        this.key = key
        this.callback = callback
        // 临时属性 触发getter
        Dependency.temp = this
        console.log(`用属性${key}创建了订阅者`)
        key.split(".").reduce((total, current) => total[current], vm.$data) // 触发属性的getter
        Dependency.temp = null
    }
    update() {
        const value = this.key.split(".").reduce((total, current) => total[current], this.vm.$data)
        this.callback(value)
    }
}
```

&emsp;&emsp;视频看了两遍，全程跟着敲，第一遍还不太理解Watcher类是如何绑定对于数据的监听的，而且不太理解getter和setter的触发的巧妙之处。
&emsp;&emsp;Watcher其实就是在虚拟dom添加至页面的时候，将每一个在页面中要被渲染的值进行监听。监听的本质就是将data中的一个值于Watcher的一个实例对象所提供的callback函数绑定在一起，每当setter函数被触发，及data中的值发生了改变，则调用callback函数。Dependency类中存储了所有的Watcher实例，此处demo中对于通知Watcher进行更新的方法是，一旦setter被触发就通知Dependency.subscriber中的所有watcher进行更新，Watcher实例自带的update函方法可以找到自己正在监听的数据，并从根实例vm中获取最新的数据值并调用自身的callback函数。callback是在解析数据的同时对Watcher实例化的时候传入的，所以callback可以直接访问到数据要解析的目标dom，当Watcher接收到了新的值，就可以直接对dom进行重新渲染，也就实现了所谓的“双向绑定”。