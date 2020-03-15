import style, { assoc, h } from 'ld-components';
import css from './test.css';


export const Collection = assoc(This => ({
    Check: 'span',
    Hello: 'div',
    Red: (props, children) => (<div {...props} class="toto">{children}</div>),
    BlueBG: (props, children) => <This.Red>blue background, red color</This.Red>
}))(
    css
);
