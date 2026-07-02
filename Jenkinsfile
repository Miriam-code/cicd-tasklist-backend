pipeline {
    agent any
    environment {
        DOCKERHUB_CREDENTIALS = credentials('okidock-dockerhub-password')
        IMAGE_NAME = 'okidock/tasklist-backend'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    stages {
        stage('Checkout') {
            steps { checkout scm }
        }
        stage('Install dependencies') {
            steps { sh 'npm ci' }
        }
        stage('Generate Prisma client') {
            steps {
                sh 'npx prisma generate'
                sh 'npx prisma generate --schema=prisma/schema-test.prisma'
            }
        }
        stage('Unit tests') {
            steps { sh 'npm run test:coverage' }
        }
        stage('Publish unit test reports') {
            steps { junit testResults: 'reports/junit.xml', allowEmptyResults: true }
        }
        stage('E2E tests') {
            steps { sh 'npm run test:e2e:coverage' }
        }
        stage('SonarQube analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    withCredentials([string(credentialsId: 'okidock-sonar-token', variable: 'MY_SONAR_TOKEN')]) {
                        sh '''
                            npx sonar-scanner \
                              -Dsonar.host.url=https://sonarqube.cicd.kits.ext.educentre.fr \
                              -Dsonar.token=$MY_SONAR_TOKEN \
                              -Dsonar.testExecutionReportPaths=
                        '''
                    }
                }
            }
        }
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Build Docker image') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }
        stage('Trivy scan') {
            steps {
                sh """
                    trivy image --severity CRITICAL,HIGH --exit-code 1 \
                      --format table --output trivy-report.txt ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }
        stage('Archive security reports') {
            steps {
                archiveArtifacts artifacts: 'trivy-report.txt', allowEmptyArchive: true
            }
        }
        stage('Generate SBOM') {
            steps {
                sh "trivy image --format spdx-json --output sbom-spdx.json ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "trivy image --format cyclonedx --output sbom-cyclonedx.json ${IMAGE_NAME}:${IMAGE_TAG}"
                archiveArtifacts artifacts: 'sbom-spdx.json,sbom-cyclonedx.json', allowEmptyArchive: true
            }
        }
        stage('Push to DockerHub') {
            steps {
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
        }
    }
    post {
        always {
            sh "docker logout || true"
            cleanWs()
        }
    }
}
