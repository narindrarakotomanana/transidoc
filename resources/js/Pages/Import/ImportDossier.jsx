import React, { useState } from 'react';
import {
    Steps,
    Upload,
    Button,
    Card,
    Typography,
    Space,
    Alert,
    Form,
    DatePicker,
    Select,
    Input,
    Row,
    Col,
    Table,
    Tag,
    message,
} from 'antd';
import { router } from '@inertiajs/react';

import {
    InboxOutlined,
    ArrowRightOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    WarningOutlined,
} from '@ant-design/icons';

import AuthenticatedLayout from '../../Layouts/AuthenticatedLayout';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const documentTypes = [
    'Reçu',
    'Facture',
    'Attestation',
    'BL',
    'Bon de sortie',
    'Déclaration',
    'Valeur MIDAC',
    'Carte grise',
    'Modèle',
    'À identifier',
    'Autre',
];

function detectDocumentType(filename) {
    const name = filename.toLowerCase();

    if (name.includes('facture')) return 'Facture';
    if (name.includes('recu') || name.includes('reçu')) return 'Reçu';
    if (name.includes('attestation')) return 'Attestation';
    if (
        name.includes('bl') ||
        name.includes('bill') ||
        name.includes('lading')
    ) {
        return 'BL';
    }
    if (name.includes('sortie')) return 'Bon de sortie';
    if (name.includes('declaration') || name.includes('déclaration')) {
        return 'Déclaration';
    }
    if (name.includes('midac')) return 'Valeur MIDAC';
    if (name.includes('carte') || name.includes('grise')) {
        return 'Carte grise';
    }
    if (name.includes('modele') || name.includes('modèle')) {
        return 'Modèle';
    }

    return 'À identifier';
}

export default function ImportDossier({ clients = [], navires = [] }) {
    const [current, setCurrent] = useState(0);
    const [files, setFiles] = useState([]);
    const [documents, setDocuments] = useState([]);

    const [form] = Form.useForm();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const uploadProps = {
        directory: true,
        multiple: true,
        showUploadList: true,
        beforeUpload: () => false,

        onChange: ({ fileList }) => {
            setFiles(fileList);

            const analyzedDocuments = fileList.map((file, index) => ({
                key: file.uid || index,
                uid: file.uid,
                filename: file.name,
                type: detectDocumentType(file.name),
                file: file.originFileObj,
            }));

            setDocuments(analyzedDocuments);
        },
    };

    const handleNext = async () => {
        if (current === 0) {
            setCurrent(1);
            return;
        }

        if (current === 1) {
            try {
                await form.validateFields();
                setCurrent(2);
            } catch (error) {
                // Ant Design affiche les erreurs du formulaire
            }

            return;
        }

        if (current === 2) {
            setCurrent(3);
        }
    };

    const handlePrevious = () => {
        setCurrent(current - 1);
    };

    const handleImport = () => {
        // Les champs sont démontés à cette étape, mais leurs valeurs sont préservées.
        const values = form.getFieldsValue(true);

        // Vérifier la présence des documents.
        if (documents.length === 0) {
            message.error('Veuillez sélectionner au moins un document.');
            setCurrent(0);
            return;
        }

        // Convertir les valeurs des Select en chaînes de caractères.
        // Le mode "tags" renvoie un tableau, même pour une seule valeur.
        const client = Array.isArray(values.client)
            ? values.client[0]
            : values.client;

        const navire = Array.isArray(values.navire)
            ? values.navire[0]
            : values.navire;

        if (!client?.trim() || !navire?.trim()) {
            message.error('Veuillez renseigner le client et le navire.');
            setCurrent(1);
            return;
        }

        // Préparer les données à envoyer à Laravel.
        const payload = {
            date_dossier: values.date_dossier.format('YYYY-MM-DD'),
            numero_bl: values.numero_bl.trim(),
            client: client.trim(),
            navire: navire.trim(),

            documents: documents.map((document) => ({
                file: document.file,
                type: document.type,
            })),
        };

        setIsSubmitting(true);

        // Envoyer les données et les fichiers au serveur.
        router.post('/importer-dossier', payload, {
            forceFormData: true,

            onSuccess: () => {
                message.success(
                    'Le dossier et ses documents ont été importés avec succès.'
                );

                setCurrent(0);
                setFiles([]);
                setDocuments([]);
                form.resetFields();
            },

            onError: (errors) => {
                const firstError = Object.values(errors)[0];

                message.error(
                    typeof firstError === 'string'
                        ? firstError
                        : "L'importation a échoué. Vérifiez les informations."
                );
            },

            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const changeDocumentType = (uid, type) => {
        setDocuments((currentDocuments) =>
            currentDocuments.map((document) =>
                document.uid === uid
                    ? { ...document, type }
                    : document
            )
        );
    };

    const columns = [
        {
            title: 'Fichier',
            dataIndex: 'filename',
            key: 'filename',
        },
        {
            title: 'Type de document',
            dataIndex: 'type',
            key: 'type',

            render: (type, record) => (
                <Select
                    value={type}
                    style={{ width: 220 }}
                    onChange={(value) =>
                        changeDocumentType(record.uid, value)
                    }
                    options={documentTypes.map((documentType) => ({
                        value: documentType,
                        label: documentType,
                    }))}
                />
            ),
        },
        {
            title: 'Statut',
            key: 'status',

            render: (_, record) => {
                if (record.type === 'À identifier') {
                    return (
                        <Tag
                            icon={<WarningOutlined />}
                            color="warning"
                        >
                            À identifier
                        </Tag>
                    );
                }

                return (
                    <Tag
                        icon={<CheckCircleOutlined />}
                        color="success"
                    >
                        Identifié
                    </Tag>
                );
            },
        },
    ];

    const unidentifiedCount = documents.filter(
        (document) => document.type === 'À identifier'
    ).length;

    return (
        <AuthenticatedLayout>
            <Space
                direction="vertical"
                size="large"
                style={{ width: '100%' }}
            >
                <div>
                    <Title level={2}>Importer un dossier</Title>

                    <Text type="secondary">
                        Importez un dossier complet dans TransiDoc.
                    </Text>
                </div>

                <Steps
                    current={current}
                    items={[
                        {
                            title: 'Dossier',
                            description: 'Sélectionner les fichiers',
                        },
                        {
                            title: 'Informations',
                            description: 'Identifier le dossier',
                        },
                        {
                            title: 'Analyse',
                            description: 'Vérifier les documents',
                        },
                        {
                            title: 'Validation',
                            description: 'Confirmer l’importation',
                        },
                    ]}
                />

                <Card>
                    {current === 0 && (
                        <Space
                            direction="vertical"
                            size="large"
                            style={{ width: '100%' }}
                        >
                            <div>
                                <Title level={4}>
                                    Sélectionner le dossier 
                                </Title>

                                <Text type="secondary">
                                    Sélectionnez le dossier complet contenant
                                    tous les documents du dossier à importer.
                                </Text>
                            </div>

                            <Dragger {...uploadProps}>
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>

                                <p className="ant-upload-text">
                                    Cliquez pour sélectionner un dossier
                                </p>

                                <p className="ant-upload-hint">
                                    Vous pouvez sélectionner un dossier
                                    complet avec tous ses sous-dossiers
                                    et fichiers.
                                </p>
                            </Dragger>

                            {files.length > 0 && (
                                <Alert
                                    type="success"
                                    showIcon
                                    message={`${files.length} fichier(s) détecté(s)`}
                                    description="Les fichiers sont prêts à être analysés."
                                />
                            )}

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ArrowRightOutlined />}
                                    disabled={files.length === 0}
                                    onClick={handleNext}
                                >
                                    Continuer
                                </Button>
                            </div>
                        </Space>
                    )}

                    {current === 1 && (
                        <Form
                            form={form}
                            layout="vertical"
                            style={{ maxWidth: 900 }}
                        >
                            <Title level={4}>
                                Informations du dossier
                            </Title>

                            <Text type="secondary">
                                Ces informations permettent à TransiDoc de
                                classer correctement le dossier.
                            </Text>

                            <div style={{ marginTop: 24 }}>
                                <Row gutter={24}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Date du dossier"
                                            name="date_dossier"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        'Veuillez sélectionner la date du dossier.',
                                                },
                                            ]}
                                        >
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                format="DD/MM/YYYY"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Navire"
                                            name="navire"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        'Veuillez sélectionner le navire.',
                                                },
                                            ]}
                                        >
                                           <Select
                                                mode="tags"
                                                showSearch
                                                placeholder="Sélectionner ou saisir un navire"
                                                optionFilterProp="label"
                                                options={navires.map((navire) => ({
                                                    value: navire.nom,
                                                    label: navire.nom,
                                                }))}
                                                maxCount={1}
                                                onChange={(value) => {
                                                    form.setFieldValue(
                                                        'navire',
                                                        Array.isArray(value) ? value : [value]
                                                    );
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Row gutter={24}>
                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Numéro BL"
                                            name="numero_bl"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        'Veuillez saisir le numéro BL.',
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder="Ex. BL-2024-00125"
                                                size="large"
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={12}>
                                        <Form.Item
                                            label="Client"
                                            name="client"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        'Veuillez sélectionner le client.',
                                                },
                                            ]}
                                        >
                                            <Select
                                                mode="tags"
                                                showSearch
                                                placeholder="Sélectionner ou saisir un client"
                                                optionFilterProp="label"
                                                options={clients.map((client) => ({
                                                    value: client.nom,
                                                    label: client.nom,
                                                }))}
                                                maxCount={1}
                                                onChange={(value) => {
                                                    form.setFieldValue(
                                                        'client',
                                                        Array.isArray(value) ? value : [value]
                                                    );
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Alert
                                    type="info"
                                    showIcon
                                    message="Classement automatique"
                                    description="Le dossier sera classé selon sa date, puis par navire et numéro BL. La date d'importation sera conservée séparément."
                                    style={{ marginTop: 8 }}
                                />
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: 32,
                                }}
                            >
                                <Button
                                    size="large"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={handlePrevious}
                                >
                                    Retour
                                </Button>

                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ArrowRightOutlined />}
                                    onClick={handleNext}
                                >
                                    Continuer
                                </Button>
                            </div>
                        </Form>
                    )}

                    {current === 2 && (
                        <Space
                            direction="vertical"
                            size="large"
                            style={{ width: '100%' }}
                        >
                            <div>
                                <Title level={4}>
                                    Analyse des documents
                                </Title>

                                <Text type="secondary">
                                    Vérifiez le classement des fichiers avant
                                    de continuer.
                                </Text>
                            </div>

                            {unidentifiedCount > 0 && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message={`${unidentifiedCount} fichier(s) à identifier`}
                                    description="Vous pouvez les laisser ainsi et les classer plus tard depuis le dossier."
                                />
                            )}

                            {unidentifiedCount === 0 &&
                                documents.length > 0 && (
                                    <Alert
                                        type="success"
                                        showIcon
                                        message="Tous les fichiers sont identifiés"
                                    />
                                )}

                            <Table
                                columns={columns}
                                dataSource={documents}
                                pagination={{
                                    pageSize: 10,
                                }}
                                scroll={{ x: true }}
                            />

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Button
                                    size="large"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={handlePrevious}
                                >
                                    Retour
                                </Button>

                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<ArrowRightOutlined />}
                                    onClick={handleNext}
                                >
                                    Continuer
                                </Button>
                            </div>
                        </Space>
                    )}

                    {current === 3 && (
                        <Space
                            direction="vertical"
                            size="large"
                            style={{ width: '100%' }}
                        >
                            <Title level={4}>
                                Vérification avant importation
                            </Title>

                            <Alert
                                type="success"
                                showIcon
                                message="Le dossier est prêt à être importé"
                                description={`${documents.length} fichier(s) seront associés à ce dossier.`}
                            />

                            <Alert
                                type="info"
                                showIcon
                                message="Classement"
                                description="Le dossier sera enregistré avec sa date métier, son navire, son numéro BL et son client."
                            />

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Button
                                    size="large"
                                    icon={<ArrowLeftOutlined />}
                                    onClick={handlePrevious}
                                >
                                    Retour
                                </Button>

                                <Button
                                    type="primary"
                                    size="large"
                                    loading={isSubmitting}
                                    disabled={isSubmitting}
                                    onClick={handleImport}
                                >
                                    Confirmer l'importation
                                </Button>
                            </div>
                        </Space>
                    )}
                </Card>
            </Space>
        </AuthenticatedLayout>
    );
}