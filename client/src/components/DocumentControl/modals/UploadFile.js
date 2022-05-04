import React from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

let UploadFile = (props) => {
    return (
        <Dragger {...props}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">Кликните мышью тут или перенесите файл на эту форму для добавления файла </p>
            <p className="ant-upload-hint">
                Можно загружать за раз несколько файлов
            </p>
        </Dragger>
    )
}

export default UploadFile