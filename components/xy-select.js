import XyButton from './xy-button.js';
if(!customElements.get('xy-button')){
    customElements.define('xy-button', XyButton);
}

class XyOption extends HTMLElement {
    static get observedAttributes() { return ["value","selected"]; }
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
        <style>
            :host{
                display: block;
            }
            .option {
                display:block;
                border-radius:0;
            }
            :host([selected="true"]) .option{
                color:var(--themeColor,dodgerblue)
            }
        </style>
        <xy-button id="option" class="option" type="flat"><slot></slot></xy-button>
        `
    }

    
    connectedCallback() {
        this.option = this.shadowRoot.getElementById('option');
    }
    
    focus() {
        this.option.focus();
    }

    get value() {
        return this.getAttribute('value');
    }

    /**
     * @param {boolean} value
     */
    set selected(value) {
        if(value){
            this.setAttribute('selected', value);
        }else{
            this.removeAttribute('selected');
        }
    }

}

customElements.define('xy-option', XyOption);

export default class XySelect extends HTMLElement {

    static get observedAttributes() { return ['value','show','disabled','placeholder'] }

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        const selected = this.querySelector(`xy-option[value='${this.value}']`);

        shadowRoot.innerHTML = `
        <style>
        :host{
            display:inline-block;
            line-height:2.4;
            font-size: 14px;
        }
        :host xy-button{
            line-height: inherit;
            font-size: inherit;
        }
        .root{
            position:relative;
            line-height: inherit;
            font-size: inherit;
            z-index: 1;
        }
        :host(:focus-within) .root{ 
            z-index: 2;
        }
        #select{
            width:100%;
        }
        #select span{
            flex:1;
            text-align:left;
        }
        .options{
            position:absolute;
            min-width:100%;
            border-radius:3px;
            overflow:hidden;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            background-color:#fff;
            margin-top:5px;
            visibility:hidden;
            transform:scale(0);
            transform-origin: top;
            transition:.3s;
        }
        #select[data-show=true]+.options{
            visibility:visible;
            transform:scale(1);
        }
        #select[data-show=true] .arrow::before{
            transform: rotate(45deg) translateX(2px);
        }
        #select[data-show=true] .arrow::after{
            transform: rotate(-45deg) translateX(-2px);
        }
        #select[data-show=true] .arrow{
            transform: translateY(-2px);
        }
        .arrow{
            position:relative;
            width: 10px;
            transition: transform .3s cubic-bezier(.645, .045, .355, 1);
        }
        .arrow::before,.arrow::after{
            position: absolute;
            width: 6px;
            height: 1.5px;
            background: #fff;
            background: currentColor;
            border-radius: 2px;
            transition: background .3s cubic-bezier(.645, .045, .355, 1),transform .3s cubic-bezier(.645, .045, .355, 1),top .3s cubic-bezier(.645, .045, .355, 1);
            content: '';
        }
        .arrow::before{
            transform: rotate(-45deg) translateX(2px);
        }
        .arrow::after{
            transform: rotate(45deg) translateX(-2px);
        }
        .placeholder{
            font-style:normal;
            opacity:.6
        }
        
        </style>
        <div class="root">
            <xy-button id="select" ${this.disabled==""?"disabled":""}><span id="value">${selected?selected.textContent:'<i class="placeholder">'+this.placeholder+'</i>'}</span><i class="arrow"></i></xy-button>
            <div class="options" id="options">
                <slot id="slot"></slot>
            </div>
        </div>
        `
    }

    setVisible(show) {
        this.show = show;
        this.select.dataset.show = show;
    }

    onshow(ev,visible) {
        this.focusIndex = Array.from(this.nodes).findIndex(el=>el.value === this.value);
        ev.stopPropagation();
        document.querySelectorAll('xy-select').forEach((item)=>{
            if(this === item ){
                if(!visible){
                    this.show = !this.show;
                    this.select.dataset.show = this.show;
                }
            }else{
                item.setVisible(false);
            }
        })
    }

    move(dir) {
        const focusIndex = dir+this.focusIndex;
        const current = this.nodes[focusIndex];
        if(current){
            current.focus();
            current.onfocus = ()=>{
                this.focusIndex = focusIndex;
            }
            this.focusIndex = focusIndex;
        }
    }

    connectedCallback() {
        this.show = false;
        this.select = this.shadowRoot.getElementById('select');
        this.options = this.shadowRoot.getElementById('options');
        this.slots = this.shadowRoot.getElementById('slot');
        this.txt = this.shadowRoot.getElementById('value');
        this.focusIndex = 0;
        this.select.addEventListener('click',(ev)=>{
            this.onshow(ev);
        })
        this.select.addEventListener('focus',(ev)=>{
            this.onshow(ev,true);
        })
        this.options.addEventListener('click',(ev)=>{
            const item = ev.target.closest('xy-option');
            if( item ){
                this.value = item.value;
                this.setVisible(false);
                this.select.focus();
            }
        })
        this.addEventListener('keydown',(ev)=>{
            if(this.show){
                switch (ev.keyCode) {
                    case 38://ArrowUp
                        this.move(-1);
                        break;
                    case 40://ArrowDown
                        this.move(1);
                        break;
                    case 8://Backspace
                    case 27://Esc
                        this.setVisible(false);
                        this.select.focus();
                        break;
                    default:
                        break;
                }
            }
        })
        document.addEventListener('click',()=>{
            this.setVisible(false);
        })
        this.slots.addEventListener('slotchange', ()=>{
            this.nodes = this.querySelectorAll(`xy-option`);
        });
    }

    get value() {
        return this.getAttribute('value');
    }

    get text() {
        const item = this.querySelector(`xy-option[value='${this.value}']`);
        return item?item.textContent:null;
    }

    get disabled() {
        return this.getAttribute('disabled');
    }

    get placeholder() {
        return this.getAttribute('placeholder')||'请选择';
    }

    set value(value) {
        this.setAttribute('value', value);
    }

    attributeChangedCallback (name, oldValue, newValue) {
        if( oldValue!==newValue ){
            if( name === 'value' ){
                let textContent = '';
                Array.from(this.querySelectorAll('xy-option')).forEach((item)=>{
                    if(item.value === newValue){
                        item.selected = true;
                        if( this.txt ){
                            textContent = item.textContent;
                            this.txt.innerText = textContent;
                        }
                    }else{
                        item.selected = false;
                    }
                })
                if(this.txt){
                    this.dispatchEvent(new CustomEvent('change',{detail:{
                        value:newValue,
                        text:textContent
                    }}));
                }
            }
            if( name == 'disabled' && this.select){
                if(newValue!=null){
                    this.select.setAttribute('disabled', 'disabled');
                }else{
                    this.select.removeAttribute('disabled');
                }
            }
        }
    }
    
}
