import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Col, Row, Tag } from 'antd';
import React from 'react';


let TitleMenu = React.memo((props) => {
    let buttons = props.buttons ? props.buttons.map((item, index) => {
        return (
            <Col key={`button${index}`}>
                {item}
            </Col>
        )
    }) : [];
    return (
        <Row justify="end" align="middle" gutter={[8, 8]}>
            <Col flex="auto">
                <h1 style={{ margin: "0 0 0 30px" }}>{props.title}</h1>
            </Col>
            {buttons}
        </Row>
    )
});

export default TitleMenu;

//{ (props.selectedRowKeys.length !== 0) ? <Col flex="auto"><Tag icon={<ExclamationCircleOutlined />} color="warning">Выбранно строк: {props.selectedRowKeys.length}</Tag></Col> : null }
