import React from 'react';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { remSize, prop } from '../../../theme';
import AsteriskIcon from '../../../images/p5-asterisk.svg';
import Nav from '../components/Header/Nav';
import RootPage from '../../../components/RootPage';
import packageData from '../../../../package.json';
import HeartIcon from '../../../images/heart.svg';
import LogoIcon from '../../../images/p5js-square-logo.svg';

export const AboutContent = styled.div`
  margin: ${remSize(42)} ${remSize(295)};

  @media (max-width: 1279px) {
    margin: ${remSize(20)};
    width: 95%;
    overflow-y: auto;
    overflow-x: hidden;
    flex-direction: column;
  }
`;

export const IntroSection = styled.div`
  & h1 {
    font-size: ${remSize(32)};
    font-weight: 700;
  }

  & a {
    padding: ${remSize(12)};
    border: ${remSize(1)} solid ${prop('primaryTextColor')};
    border-radius: ${remSize(24)};
    display: flex;
    align-items: center;
    width: ${remSize(110)};
    justify-content: space-evenly;
    &:hover {
      color: ${prop('Button.primary.default.background')};
      background-color: ${prop('Button.primary.hover.background')};
      border-color: ${prop('Button.primary.hover.border')};
      text-decoration: none;

      & svg {
        & path {
          fill: ${prop('Button.primary.default.background')};
        }
      }
    }
  }
`;

export const IntroSectionContent = styled.div`
  display: flex;
  align-items: center;

  & div {
    height: 100%;
    align-items: center;
    font-weight: 550;
    font-size: ${remSize(24)};
    margin: ${remSize(24)};
  }

  & svg {
    & path {
      fill: ${prop('logoColor')};
    }
  }

  @media (max-width: 769px) {
    flex-direction: column;
    align-items: start;

    & div {
      margin: ${remSize(24)} 0;
    }
  }
`;

export const IntroSectionDescription = styled.div`
  line-height: ${remSize(27)};
  font-size: ${remSize(16)};
  margin: ${remSize(24)} 0;

  p {
    margin-bottom: ${remSize(24)};
  }
`;

export const Section = styled.div`
  margin: ${remSize(50)} 0;

  & h3 {
    font-size: ${remSize(24)};
    padding-bottom: ${remSize(30)};
    font-weight: 600;
  }

  @media (max-width: 769px) {
    display: grid;
  }
`;

export const SectionContainer = styled.div`
  display: flex;
  justify-content: row;
  padding-top: 0;
  font-size: ${remSize(16)};
  width: 100%;
  flex-wrap: wrap;

  @media (max-width: 769px) {
    display: grid;
  }
`;

export const SectionItem = styled.div`
  width: 33%;
  display: flex;
  line-height: ${remSize(19.5)};
  font-size: ${remSize(14)};
  padding: 0 ${remSize(30)} ${remSize(30)} 0;

  & p {
    margin-top: ${remSize(7)};
  }

  & a {
    font-weight: 700;
    font-size: ${remSize(16)};
    &:hover {
      text-decoration: underline;
    }
  }

  & svg {
    padding-right: ${remSize(8)};
    width: ${remSize(30)};
    height: ${remSize(20)};
    & path {
      fill: ${prop('logoColor')};
      stroke: ${prop('logoColor')};
    }
  }

  @media (max-width: 1279px) {
    width: 50%;
  }

  @media (max-width: 769px) {
    width: 100%;
  }
`;

export const ContactSection = styled.div`
  margin-bottom: ${remSize(50)};

  & h3 {
    font-size: ${remSize(24)};
    font-weight: 600;
  }

  & div {
    display: flex;
    width: 100%;
    margin: ${remSize(20)} 0;
    font-size: ${remSize(16)};
  }
`;

export const ContactSectionTitle = styled.p`
  width: 50%;

  @media (max-width: 769px) {
    width: 30%;
  }
`;

export const ContactSectionDetails = styled.p`
  width: 50%;

  & a {
    color: ${prop('logoColor')};
    &:hover {
      text-decoration: underline;
    }
  }

  @media (max-width: 769px) {
    width: 70%;
  }
`;

export const Footer = styled.div`
  border-top: 0.1rem dashed;
  padding-right: ${remSize(20)};
  padding-bottom: ${remSize(70)};
  width: 100%;
  font-size: ${remSize(16)};

  & div {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
  }

  & a {
    padding-top: ${remSize(20)};
    padding-right: 9.5%;
    color: ${prop('logoColor')};
    &:hover {
      text-decoration: underline;
    }
  }

  & p {
    padding-top: ${remSize(20)};
    padding-right: 9.5%;
  }

  @media (max-width: 770px) {
    flex-direction: column;
    padding-left: ${remSize(20)};
    padding-right: ${remSize(20)};
  }

  @media (max-width: 550px) {
    padding-left: 0;

    & div {
      display: grid;
    }
  }
`;

const About = () => {
  const { t } = useTranslation();

  const p5version = useSelector((state) => {
    const index = state.files.find((file) => file.name === 'index.html');
    return index?.content.match(/\/p5\.js\/([\d.]+)\//)?.[1];
  });

  return (
    <RootPage>
      <Helmet>
        <title> {t('About.TitleHelmet')} </title>
      </Helmet>

      <Nav layout="dashboard" />

      <AboutContent>
        <IntroSection>
          <h1>{t('About.Title')}</h1>
          <IntroSectionContent>
            <LogoIcon
              role="img"
              aria-label={t('Common.p5logoARIA')}
              focusable="false"
            />
            <div>
              <p>{t('About.OneLine')}</p>
            </div>
          </IntroSectionContent>
          <IntroSectionDescription>
            <p>{t('About.Description1')}</p>
            <p>{t('About.Description2')}</p>
          </IntroSectionDescription>
          <a
            href="https://p5js.org/donate/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <HeartIcon aria-hidden="true" focusable="false" />
            {t('About.Donate')}
          </a>
        </IntroSection>

        <Section>
          <h3>{t('About.NewP5')}</h3>
          <SectionContainer>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://p5js.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.Home')}
                </a>
                <p>{t('About.LinkDescriptions.Home')}</p>
              </div>
            </SectionItem>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://p5js.org/examples/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.Examples')}
                </a>
                <p>{t('About.LinkDescriptions.Examples')}</p>
              </div>
            </SectionItem>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <Link to="/code-of-conduct">{t('About.CodeOfConduct')}</Link>
                <p>{t('About.LinkDescriptions.CodeOfConduct')}</p>
              </div>
            </SectionItem>
          </SectionContainer>
        </Section>

        <Section>
          <h3>{t('About.Resources')}</h3>
          <SectionContainer>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://p5js.org/libraries/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.Libraries')}
                </a>
                <p>{t('About.LinkDescriptions.Libraries')}</p>
              </div>
            </SectionItem>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://p5js.org/reference/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.Reference')}
                </a>
                <p>{t('About.LinkDescriptions.Reference')}</p>
              </div>
            </SectionItem>
          </SectionContainer>
        </Section>

        <Section>
          <h3>{t('Get Involved')}</h3>
          <SectionContainer>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://p5js.org/donate/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.Donate')}
                </a>
                <p>{t('About.LinkDescriptions.Donate')}</p>
              </div>
            </SectionItem>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://github.com/processing/p5.js-web-editor"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.Contribute')}
                </a>
                <p>{t('About.LinkDescriptions.Contribute')}</p>
              </div>
            </SectionItem>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://github.com/processing/p5.js-web-editor/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.Report')}
                </a>
                <p>{t('About.LinkDescriptions.Report')}</p>
              </div>
            </SectionItem>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://discourse.processing.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.ForumCTA')}
                </a>
                <p>{t('About.LinkDescriptions.Forum')}</p>
              </div>
            </SectionItem>
            <SectionItem>
              <AsteriskIcon aria-hidden="true" focusable="false" />
              <div>
                <a
                  href="https://discord.com/invite/SHQ8dH25r9"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('About.DiscordCTA')}
                </a>
                <p>{t('About.LinkDescriptions.Discord')}</p>
              </div>
            </SectionItem>
          </SectionContainer>
        </Section>

        <ContactSection>
          <h3>{t('Contact')}</h3>
          <div>
            <ContactSectionTitle>{t('About.Email')}</ContactSectionTitle>
            <ContactSectionDetails>
              {t('About.EmailAddress')}
            </ContactSectionDetails>
          </div>
          <div>
            <ContactSectionTitle>{t('About.Socials')}</ContactSectionTitle>
            <ContactSectionDetails>
              {[
                {
                  label: t('About.Github'),
                  href: 'https://github.com/processing/p5.js-web-editor'
                },
                {
                  label: t('About.Instagram'),
                  href: 'https://www.instagram.com/p5xjs'
                },
                {
                  label: t('About.Youtube'),
                  href: 'https://www.youtube.com/@ProcessingFoundation'
                },
                { label: t('About.X'), href: 'https://x.com/p5xjs' }, // Assuming "X" is Twitter
                {
                  label: t('About.Discord'),
                  href: 'https://discord.gg/SHQ8dH25r9'
                },
                {
                  label: t('About.Forum'),
                  href: 'https://forum.processing.org/'
                }
              ].map((item, index, array) => (
                <React.Fragment key={item.href}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                  {index < array.length - 1 && ', '}
                </React.Fragment>
              ))}
            </ContactSectionDetails>
          </div>
        </ContactSection>

        <Footer>
          <div>
            <Link to="/privacy-policy">{t('About.PrivacyPolicy')}</Link>
            <Link to="/terms-of-use">{t('About.TermsOfUse')}</Link>
            <Link to="/code-of-conduct">{t('About.CodeOfConduct')}</Link>
          </div>
          <p>
            {t('About.WebEditor')}: <span>v{packageData?.version}</span>
          </p>
          <p>
            p5.js: <span>v{p5version}</span>
          </p>
        </Footer>
      </AboutContent>
    </RootPage>
  );
};

export default About;
