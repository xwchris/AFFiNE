import {
  Button,
  Divider,
  Menu,
  PropertyCollapsibleContent,
  PropertyCollapsibleSection,
} from '@affine/component';
import { CreatePropertyMenuItems } from '@affine/core/components/doc-properties/menu/create-doc-property';
import { DocPropertyRow } from '@affine/core/components/doc-properties/table';
import { DocDatabaseBacklinkInfo } from '@affine/core/modules/doc-info';
import type {
  DatabaseRow,
  DatabaseValueCell,
} from '@affine/core/modules/doc-info/types';
import { DocsSearchService } from '@affine/core/modules/docs-search';
import { useI18n } from '@affine/i18n';
import track from '@affine/track';
import { PlusIcon } from '@blocksuite/icons/rc';
import {
  type DocCustomPropertyInfo,
  DocsService,
  LiveData,
  useLiveData,
  useServices,
} from '@toeverything/infra';
import { useCallback, useMemo, useState } from 'react';

import * as styles from './info-modal.css';
import { LinksRow } from './links-row';

export const InfoTable = ({
  onClose,
  docId,
}: {
  docId: string;
  onClose: () => void;
}) => {
  const t = useI18n();
  const { docsSearchService, docsService } = useServices({
    DocsSearchService,
    DocsService,
  });
  const [newPropertyId, setNewPropertyId] = useState<string | null>(null);
  const properties = useLiveData(docsService.propertyList.sortedProperties$);
  const links = useLiveData(
    useMemo(
      () => LiveData.from(docsSearchService.watchRefsFrom(docId), null),
      [docId, docsSearchService]
    )
  );
  const backlinks = useLiveData(
    useMemo(
      () => LiveData.from(docsSearchService.watchRefsTo(docId), null),
      [docId, docsSearchService]
    )
  );

  const onBacklinkPropertyChange = useCallback(
    (_row: DatabaseRow, cell: DatabaseValueCell, _value: unknown) => {
      track.$.docInfoPanel.databaseProperty.editProperty({
        type: cell.property.type$.value,
      });
    },
    []
  );

  const onPropertyAdded = useCallback((property: DocCustomPropertyInfo) => {
    setNewPropertyId(property.id);
    track.$.docInfoPanel.property.addProperty({
      type: property.type,
      control: 'at menu',
    });
  }, []);

  return (
    <>
      {backlinks && backlinks.length > 0 ? (
        <>
          <LinksRow
            references={backlinks}
            onClick={onClose}
            label={t['com.affine.page-properties.backlinks']()}
          />
          <Divider size="thinner" />
        </>
      ) : null}
      {links && links.length > 0 ? (
        <>
          <LinksRow
            references={links}
            onClick={onClose}
            label={t['com.affine.page-properties.outgoing-links']()}
          />
          <Divider size="thinner" />
        </>
      ) : null}
      <PropertyCollapsibleSection
        title={t.t('com.affine.workspace.properties')}
      >
        <PropertyCollapsibleContent
          className={styles.tableBodyRoot}
          collapseButtonText={({ hide, isCollapsed }) =>
            isCollapsed
              ? hide === 1
                ? t['com.affine.page-properties.more-property.one']({
                    count: hide.toString(),
                  })
                : t['com.affine.page-properties.more-property.more']({
                    count: hide.toString(),
                  })
              : hide === 1
                ? t['com.affine.page-properties.hide-property.one']({
                    count: hide.toString(),
                  })
                : t['com.affine.page-properties.hide-property.more']({
                    count: hide.toString(),
                  })
          }
        >
          {properties.map(property => (
            <DocPropertyRow
              key={property.id}
              propertyInfo={property}
              defaultOpenEditMenu={newPropertyId === property.id}
            />
          ))}
          <Menu
            items={<CreatePropertyMenuItems onCreated={onPropertyAdded} />}
            contentOptions={{
              onClick(e) {
                e.stopPropagation();
              },
            }}
          >
            <Button
              variant="plain"
              prefix={<PlusIcon />}
              className={styles.addPropertyButton}
            >
              {t['com.affine.page-properties.add-property']()}
            </Button>
          </Menu>
        </PropertyCollapsibleContent>
      </PropertyCollapsibleSection>
      <Divider size="thinner" />
      <DocDatabaseBacklinkInfo onChange={onBacklinkPropertyChange} />
    </>
  );
};
