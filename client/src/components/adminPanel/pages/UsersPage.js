import {
    DeleteOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import { gql, useMutation } from '@apollo/client';
import { Button, Col, Form, Input, Popconfirm, Row, Card, Tree, Divider, Checkbox, Tag, Transfer, Empty, Avatar } from 'antd';
import React, { useEffect, useState } from 'react';
import { handlerMutation, handlerQuery, useUser } from '../../../core/functions';
import ModalInsert from '../../../core/modal/ModalInsert';
import ModalUpdate from '../../../core/modal/ModalUpdate';
import TitleMenu from '../../../core/TitleMenu';
import TableContainer from "../../../core/TableContainer";
import test from "../../../core/functions/test";
import { AntDesignOutlined } from '@ant-design/icons';
import MarkTable from './MarkTable';
const modalFormWidth = 650;

const { Meta } = Card

let UsersPage = () => {

    return (
        <Row>
            <Col flex={1}>
                <Card
                    hoverable
                    style={{ width: 240 }}
                    cover={<img alt="example" src="https://media.istockphoto.com/vectors/avatar-5-vector-id1131164548?k=20&m=1131164548&s=612x612&w=0&h=ODVFrdVqpWMNA1_uAHX_WJu2Xj3HLikEnbof6M_lccA=" />}
                >
                    <Meta title="Иванов Иван Иванович" description="Школа номер 1, 12 класс" />
                </Card>
            </Col>
            <Col flex={4}>
                <Row gutter={[10, 80]}>
                    <Col span={12}>
                    Оценки аттестата
                        <MarkTable />
                    </Col>
                    <Col span={12}>
                    Оценки ЕНТ
                        <MarkTable/>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

export default UsersPage;