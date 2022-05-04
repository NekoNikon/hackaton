import { Form, Input, Button, Row, Col,Space } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import 'antd/dist/antd.less';
import React, {useEffect, useState} from 'react'
import { gql, useMutation } from '@apollo/client';
import {handlerMutation} from "../core/functions";
import constants from "../config/constants";
import Layout from 'antd/lib/layout/layout';
import "./style.css";

const loginGQL = gql`
    mutation login($user: JSON) {
        login(user: $user){
            username
        }
    }`;
const Login = () => {
    let [user, setUser] = useState();
    const [login, { loading, data }] = handlerMutation(useMutation(loginGQL))();
    useEffect(() => {
        if (user) {
            login({ variables: { user }})
        }
    }, [user]);

    useEffect(() => {
        if (data) {
            const requestOptions = {
                method: 'POST',
                headers: new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' }),
                body: JSON.stringify(user)
            };
            fetch('https://'+constants.host+':'+constants.port+'/login', requestOptions)
                .then((response) => {
                    if (response.url != window.location.href) {
                        window.location.href = response.url
                    } else {
                        console.log(response);
                    }
                });
        }
    }, [data]);
    const onFinish = (values) => {

    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    const [form] = Form.useForm();
    return (
        <Row justify="center" align="middle" style={{ height: "95vh"}}>
            <Col >
                <Form
                    form={form}
                    name="basic"
                    onFinish={setUser}
                    onFinishFailed={onFinishFailed}
                >
                <Row gutter={16}>
                    <Col>
                    <div className='authorizationHeader'>АВТОРИЗАЦИЯ</div>
                    <Form.Item
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: 'Необходимо для заполнения!',
                            },
                        ]}
                    >
                        <Input className='loginFormName' placeholder="Имя пользователя"/>
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: 'Необходимо для заполнения!',
                            },
                        ]}
                    >
                        <Input.Password className='loginFormPassword' placeholder="Пароль" iconRender={visible => (visible ? <EyeTwoTone style={{color:'#fff'}} className="loginIcons"/> : <EyeInvisibleOutlined style={{color:'#fff'}} className="loginIcons"/>)} />
                    </Form.Item>
                    <Form.Item className='loginFormItem'>
                        <Button htmlType="submit" loading={loading} className='login_btn'>
                            Войти
                        </Button>
                    </Form.Item>
                    </Col>
                </Row>
                </Form>
            </Col>
        </Row>
		
    );
};


export default Login;
