import {Button, Result} from "antd";
import {NavLink} from "react-router-dom";
import React from "react";

const Error404 = () => {
    return (
        <Result
            status="404"
            title="404"
            subTitle='Упс, страница не найдена или нет доступа.'
            extra={<Button type="primary"><NavLink to='/'>На главную</NavLink></Button>}
        />
    )
}

export default Error404;