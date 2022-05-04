import { Divider, Row, Select } from 'antd';
import { Layout } from 'antd';
import React, { useState } from 'react';
import { useUser, accessRedirect } from '../../core/functions';
import Header1 from '../../core/Header1';
import { Table, Space, Typography } from 'antd';
import {
    Form,
    Button,
    DatePicker
} from 'antd';
import { Context } from "../../core/Context";

import Search from 'antd/lib/input/Search';
import { gql, useQuery, useSubscription } from '@apollo/client';
import { notifyMe } from '../../core/functions';
import { useHistory } from 'react-router-dom';
import StudyGrid from './StudyGrid';

const { RangePicker } = DatePicker;
const { Title } = Typography;
const pagination = { position: 'bottom' };
const { Option } = Select;

const { Content } = Layout

let edus_list = [
    "Университет 1",
    "Колледж 1",
    "Университет 2",
    "Университет 3",
    "Колледж 2",
    "Университет 4",
    "Университет 5",
    "Колледж 3",
    "Колледж 4",
    "Колледж 6",
]

let specials = [
    {title:'Преподаватель информатики', type_path:1},
    {title:'Архитектор ПО', type_path:2},
    {title:'Строитель', type_path:3},
]

let StudyPage = () => {
    const [context, setContext] = useState("default context value");
    const user = useUser();
    

    return (
        <Context.Provider value={[context, setContext]}>
            <Layout>
                <Header1 title={'Обучение'} user={user} />
                <Layout>

                    <Layout className="content-layout">
                        <Content className="site-layout-background"
                            style={{
                                padding: 24,
                                margin: 0,
                                minHeight: 280
                            }}>
                            <Row>
                                <Form
                                    layout="inline"
                                    className=""
                                    style={{ margin: 16 }}>
                                    <Form.Item label="Поиск по специальностям">
                                        <Select
                                            showSearch
                                            style={{ width: 200 }}
                                            placeholder="Search to Select"
                                            optionFilterProp="children"
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                            filterSort={(optionA, optionB) =>
                                                optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                            }
                                        >
                                            {edus_list.map((item,i)=>{
                                                return(<Option value={`${item}`}>{item}</Option>)
                                            })}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Поиск по учебным заведениям">
                                        <Select
                                            showSearch
                                            style={{ width: 200 }}
                                            placeholder="Search to Select"
                                            optionFilterProp="children"
                                            filterOption={(input, option) =>
                                                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                            }
                                            filterSort={(optionA, optionB) =>
                                                optionA.children.toLowerCase().localeCompare(optionB.children.toLowerCase())
                                            }
                                        >
                                            {specials.map(item=>{
                                                return (<Option value={'item'}>{item.title}</Option>)
                                            })}
                                        </Select>
                                    </Form.Item>
                                </Form>

                            </Row>
                            <Divider type='horizontal'/>

                            <StudyGrid specs={specials} edus={edus_list} />

                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        </Context.Provider>
    )
}

export default StudyPage