class Vue {
    constructor({el, data}) {
        this.$el = el
        this.$data = data
        Observer(this.$data)
        Compile(el, this)
    }
}

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