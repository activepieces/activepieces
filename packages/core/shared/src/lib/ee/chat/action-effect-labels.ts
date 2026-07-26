/**
 * Effect label for every action in the piece catalog: what it does in the real world, so
 * chat can decide what needs a human's yes. Read/internal labels are only trusted when the
 * action's own name agrees (see resolveActionEffect) — a label can never make something
 * look safer than its name suggests.
 *
 * GENERATED — do not hand-edit a line here. Regenerate with tools/action-effects. A piece
 * overrides its own entry by declaring `aiMetadata.effect` on the action.
 *
 * One line per piece: `<piece> <action>=<code>[!][:<recipientInputKey>] ...`
 * Codes: r read · W internal write · D internal destructive · w external write ·
 *        o outward send · d destructive · f financial · i depends on input
 * A trailing `!` marks a hand-reviewed entry that the resolver trusts as-is; every other
 * entry may still be escalated when the action's own name implies something worse.
 */

export type ActionEffectLabel = {
    kind: string
    recipientProp?: string
    authoritative?: boolean
}

const KIND_BY_CODE: Record<string, string> = {
    r: 'read',
    W: 'internal_write',
    D: 'internal_destructive',
    w: 'external_write',
    o: 'outward_send',
    d: 'destructive',
    f: 'financial',
    i: 'input_dependent',
}

const ENCODED_LABELS = `
activecampaign activecampaign_add_contact_to_account=w activecampaign_add_tag_to_contact=w activecampaign_create_account=w activecampaign_create_contact=w activecampaign_subscribe_or_unsubscribe_contact_from_list=w activecampaign_update_account=w activecampaign_update_contact=w
activepieces create_project=w list_project=r update_project=w
actualbudget get_accounts=r get_budget=r get_categories=r import_transaction=w import_transactions=w
acuity-scheduling add_blocked_time=w create_appointment=o:email create_client=w find_appointment=r find_client=r reschedule_appointment=o update_client=w
acumbamail acumbamail_add_update_subscriber=o:listMergeFields acumbamail_create_subscriber_list=w acumbamail_delete_subscriber_list=d acumbamail_duplicate_template=w acumbamail_remove_subscriber=d acumbamail_search_subscriber=r acumbamail_unsubscribe_subscriber=w
add-event create_add_to_calendar_links=w create_event=w create_rsvp_attendee=o:email delete_calendar_subscriber=d delete_event=d find_event=r find_or_create_event=w update_event=w
afforai afforai_ask_chatbot=r
agentx createConversationWithSingleAgent=w find_conversation=r find_message=r search_agents=r sendMessageToExistingConversation=w
ai askAi=W! classifyText=W! extractStructuredData=W! generateImage=W! run_agent=i! summarizeText=W!
aianswer createPhoneCall=o:phoneNumber getCallDetails=r getCallTranscript=r gmailGetListOfAgents=r scheduleCallAgent=o:phoneNumber
aidbase add_faq_item=w add_video=w add_website=w create_chatbot_reply=w create_faq=w start_training=w
aiprise create_business_profile=w create_user_profile=w get_additional_user_info=r get_business_documents=r get_business_input_data=r get_business_profile=r get_business_verification_result=r get_user_input_data=r get_user_profile=r get_verification_result=r get_verification_url=w run_business_verification=w run_document_check=w run_user_verification_profile=w search_businesses=r update_verification_result=w
air-ops get_execution=r run_workflow=i run_workflow_async=i
aircall commentACall=w createAContact=w findCalls=r findContact=r getCall=r tagACall=w updateContact=w
airparser extract_data_from_document=r upload_document=w
airtable airtable_add_comment_to_record=o airtable_clean_record=d airtable_create_base=w airtable_create_record=w airtable_create_table=w airtable_delete_record=d airtable_find_base=r airtable_find_record=r airtable_find_table=r airtable_find_table_by_id=r airtable_get_base_schema=r airtable_get_record_by_id=r airtable_update_record=w airtable_upload_file_to_column=w
airtop click=i create-browser-window=w create-session=w hover-element=i page-query=r paginated-extraction=r smart-scrape=r take-screenshot=r terminate-session=w type=i upload-file-to-session=w
alai addSlide=w deletePresentation=d exportPresentation=w generatePresentation=w getGeneration=r
algolia browse-records=r delete-records=d save-records=w
alt-text-ai generate-alt-text=r
alttextify generate-alt-text=w
amazon-bedrock custom_api_call=i generate_content_from_image=r generate_embeddings=r generate_image=r send_prompt=r
amazon-s3 decrypt-pgp-file=r deleteFile=d generate-signed-upload-url=r generate-signed-url=r list-files=r moveFile=d read-file=r upload-file=w
amazon-secrets-manager createSecret=w deleteSecret=d findSecret=r getARandomPassword=r getSecretValue=r updateSecret=w
amazon-ses create_custom_verification_email_template=w create_email_template=w send_custom_verification_email=o:emailAddress send_email=o:toAddresses send_templated_email=o:toAddresses update_custom_verification_email_template=w update_email_template=w
amazon-sns send-message=o:topic
amazon-sqs sendMessage=w
amazon-textract analyze-document=r analyze-document-async=r analyze-expense=r analyze-id=r detect-document-text=r get-document-analysis=r start-document-analysis=w
aminos createUser=w
ampeco authorizationRead=r authorizationsListing=r bookingRead=r bookingRequestCreate=w bookingRequestRead=r bookingRequestsListing=r bookingsListing=r cdrRead=r cdrsListing=r certificateIssueAnEmaid=w certificateReissueAnEmaid=w changeFlexibilityAssetStatus=w charegPointShareDelete=d chargePointAvailablePersonalSmartChargingModesListing=r chargePointChangeAvailability=w chargePointChangeOwner=w chargePointChangeSharingCode=w chargePointClearChargingProfile=w chargePointConfigurationRead=r chargePointConfigurationUpdate=w chargePointConfigurationsListing=r chargePointCreate=w chargePointDelete=d chargePointDeleteCertificate=d chargePointDowntimePeriodCreate=w chargePointDowntimePeriodDelete=d chargePointDowntimePeriodRead=r chargePointDowntimePeriodUpdate=w chargePointDowntimePeriodsListing=r chargePointEvseConnectorCreate=w chargePointEvseConnectorDelete=d chargePointEvseConnectorRead=r chargePointEvseConnectorUpdate=w chargePointEvseConnectorsListing=r chargePointEvseCreate=w chargePointEvseDelete=d chargePointEvseRead=r chargePointEvseUnlock=w chargePointEvseUpdate=w chargePointEvsesListing=r chargePointGetDiagnostics=w chargePointGetInstalledCertificateIds=r chargePointGetSecurityLog=w chargePointInstallCertificate=w chargePointModelCreate=w chargePointModelDelete=d chargePointModelRead=r chargePointModelUpdate=w chargePointModelsListing=r chargePointMoveEvsesToSatellite=w chargePointPersonalSmartChargingPreferencesRead=r chargePointRead=r chargePointReserve=w chargePointReset=w chargePointResetSecurityProfile=w chargePointSendDataTransfer=i chargePointSetChargingProfile=w chargePointSetConfiguration=w chargePointShareCreate=w chargePointShareRead=r chargePointSharedPartnersListing=r chargePointSharedPartnersSync=w chargePointSharesListing=r chargePointSmartChargingUpdate=w chargePointStartChargingSession=f chargePointStartChargingSessionWithoutEvse=f chargePointStatusRead=r chargePointStopChargingSession=f chargePointSyncConfiguration=r chargePointTriggerMessageChargePoint=w chargePointUpdate=w chargePointUpdateFirmware=w chargePointVendorCreate=w chargePointVendorDelete=d chargePointVendorRead=r chargePointVendorUpdate=w chargePointVendorsListing=r chargePointsListing=r circuitAttachChargePoint=w circuitChargePointPrioritiesListing=r circuitConsumption=r circuitCreate=w circuitDelete=d circuitDetachChargePoint=w circuitRead=r circuitSetChargePointEvsePriority=w circuitSetChargePointPriority=w circuitSetCircuitSocPriority=w circuitSetSessionPriority=w circuitSocPrioritiesListing=r circuitUnmanagedLoadRead=r circuitUpdate=w circuitUserPrioritiesListing=r circuitUserPriorityCreate=w circuitUserPriorityDelete=d circuitUserPriorityRead=r circuitUserPriorityUpdate=w circuitsListing=r configurationTemplateApplyToChargePoints=w configurationTemplateBulkCreateVariables=w configurationTemplateVariableCreate=w configurationTemplateVariableDelete=d configurationTemplateVariableListing=r configurationTemplateVariableUpdate=w contactDetailsDelete=d contactDetailsRead=r contactDetailsUpdate=w createConfigurationTemplate=w createCurrencyRate=w createFlexibilityAsset=w createInstallerJob=w createParkingSpace=w createPaymentTerminal=w createPcId=w createRoamingCustomTariffFilter=w createUtility=w currenciesListing=r currencyCreate=w currencyRead=r currencyUpdate=w customFeeRead=r customFeesListing=r deleteConfigurationTemplate=d deleteCurrencyRate=d deleteDowntimePeriodNotice=d deleteFlexibilityAsset=d deleteInstallerJob=d deleteParkingSpace=d deletePaymentTerminal=d deletePcId=d deleteRoamingCustomTariffFilter=d deleteUtility=d electricityMeterCreate=w electricityMeterDelete=d electricityMeterRead=r electricityMeterReportConsumption=w electricityMeterUpdate=w electricityMetersLising=r electricityRateCreate=w electricityRateDelete=d electricityRateEnergyMixRead=r electricityRateEnergyMixUpdate=w electricityRatePricePeriodsDateCreateOrUpdate=w electricityRatePricePeriodsDateDelete=d electricityRatePricePeriodsDateListing=r electricityRatePricePeriodsDateRead=r electricityRatePricePeriodsListing=r electricityRatePricePeriodsWeekDayCreateaOrUpdate=w electricityRatePricePeriodsWeekDayDelete=d electricityRatePricePeriodsWeekDayListing=r electricityRatePricePeriodsWeekDayRead=r electricityRateRead=r electricityRateUpdate=w electricityRatesListing=r evseCreate=w evseDelete=d evseDowntimePeriodCreate=w evseDowntimePeriodDelete=d evseDowntimePeriodRead=r evseDowntimePeriodUpdate=w evseDowntimePeriodsListing=r evseRead=r evseStartChargingWithEvseId=f evseTriggerMessage=w evseUpdate=w evsesListing=r expensesListing=r faqCreate=w faqDelete=d faqRead=r faqUpdate=w faqsListing=r firmwareVersionAttachedModels=r firmwareVersionRead=r firmwareVersionsListing=r flexibilityAssetCreateActivationRequest=w getChargePointLatestHardwareStatusLog=r getChargePointLatestNetworkStatusLog=r getConfigurationTemplate=r getCurrencyRate=r getDowntimePeriodNotice=r getDowntimePeriodNotices=r getEvseLatestHardwareStatusLog=r getFlexibilityActivationRequest=r getFlexibilityAsset=r getHistoricalTimeSeries=r getInstallerJob=r getInstallerJobsList=r getParkingSpace=r getPaymentTerminal=r getPaymentTerminals=r getPcId=r getRoamingConnection=r getRoamingCustomTariffFilter=r getTimeSeriesForecast=r getUtility=r idTagCreate=w idTagDelete=d idTagRead=r idTagUpdate=w idTagsListing=r invoiceDetailsCreateOrUpdate=w invoiceDetailsRead=r invoiceRead=r invoicesListing=r listChargePointHardwareStatusLogs=r listChargePointNetworkStatusLogs=r listConfigurationTemplates=r listCurrencyRates=r listEvseHardwareStatusLogs=r listFlexibilityActivationRequests=r listFlexibilityAssets=r listParkingSpace=r listPcIds=r listRoamingConnections=r listRoamingCustomTariffFilters=r listUtilities=r locationChargingZoneCreate=w locationChargingZoneDelete=d locationChargingZoneRead=r locationChargingZoneUpdate=w locationChargingZonesListing=r locationCheckBookingAvailability=r locationCreate=w locationDelete=d locationRead=r locationUpdate=w locationsListing=r notificationRead=r notificationsCreate=w notificationsListing=r notificationsResendFailed=w notificationsSubscribe=w notificationsUnsubscribe=d parkingSpaceUpdateOccupancyStatus=w partnerContractCreate=f partnerContractDelete=d partnerContractRead=r partnerContractUpdate=f partnerContractsListing=r partnerCreate=w partnerDelete=d partnerInviteCreate=o:email partnerInviteDelete=d partnerInviteRead=r partnerInviteUpdate=w partnerInvitesListing=r partnerRead=r partnerSettlementReportPartnerSettlementRecordCreate=w partnerSettlementReportPartnerSettlementRecordDelete=d partnerSettlementReportPartnerSettlementRecordUpdate=w partnerSettlementReportPartnerSettlementRecordsListing=r partnerSettlementReportRead=r partnerSettlementReportsListing=r partnerUpdate=w partnersListing=r partnertSettlementReportPartnerSettlementRecordRead=r patchDowntimePeriodNotice=w paymentMethodCreate=w paymentMethodDelete=d paymentMethodRead=r paymentMethodUpdate=w paymentMethodsListing=r personalSmartChargingPreferencesUpdate=w postDowntimePeriodNotice=w receiptRead=r receiptsListing=r reorderRoamingCustomTariffFilters=w reservationCancel=w reservationRead=r reservationsListing=r revenuesListing=r roamingOperatorRead=r roamingOperatorUpdate=w roamingOperatorsListing=r roamingProviderCreate=w roamingProviderDelete=d roamingProviderRead=r roamingProviderUpdate=w roamingProvidersListing=r roamingTariffRead=r roamingTariffUpdate=w roamingTariffsListing=r securityEventRead=r securityEventsListing=r sessionAssignToUser=w sessionRead=r sessionRetryPayment=f sessionsConsumptionStatsRead=r sessionsListing=r settingsListing=r subOperatorRead=r subOperatorsListing=r subscriptionPlanCreate=w subscriptionPlanDelete=d subscriptionPlanRead=r subscriptionPlanReplace=w subscriptionPlanUpdate=w subscriptionPlansListing=r subscriptionRead=r subscriptionsListing=r tariffCreate=w tariffDelete=d tariffGroupCreate=w tariffGroupDelete=d tariffGroupRead=r tariffGroupUpdate=w tariffGroupsListing=r tariffRead=r tariffSetDisplayInformation=w tariffSnapshotRead=r tariffUpdate=w tariffsListing=r taxCreate=w taxDelete=d taxIdentificationNumberCreate=w taxIdentificationNumberDelete=d taxIdentificationNumberRead=r taxIdentificationNumberUpdate=w taxIdentificationNumbersListing=r taxRead=r taxUpdate=w taxesListing=r templatesListing=r termsAndPoliciesListing=r termsAndPoliciesRead=r topUpPackagCreate=w topUpPackageDelete=d topUpPackageRead=r topUpPackageUpdate=w topUpPackagesListing=r transactionIssueInvoice=f:email transactionRead=r transactionResendInvoice=o transactionUpdate=w transactionUpdatePaymentReference=w transactionsCreate=f transactionsListing=r updateConfigurationTemplate=w updateCurrencyRate=w updateCustomTariffFilterTariff=w updateFlexibilityAsset=w updateInstallerJob=w updateParkingSpace=w updatePaymentTerminal=w updatePcId=w updateRoamingCustomTariffFilter=w updateUtility=w userActivateSubscription=f userAddBalance=f userApplyCustomFee=f userCancelSubscription=f userChangeStatus=w userClearSubscriptionAmountDue=d userCreate=w userDelete=d userExportAllPrivateData=r userGroupCreate=w userGroupDelete=d userGroupRead=r userGroupUpdate=w userGroupsListing=r userRead=r userRedeemVoucher=f userUpdate=w usersListing=r vendorErrorCodeCreate=w vendorErrorCodeDelete=d vendorErrorCodeRead=r vendorErrorCodeUpdate=w vendorErrorCodesListing=r voucherCreate=w voucherDelete=d voucherRead=r voucherUpdate=w vouchersListing=r
apify getDatasetItems=r getKeyValueStoreRecord=r runActor=w runTask=w scrapeSingleUrl=r
apitable apitable_create_record=w apitable_find_record=r apitable_update_record=w
apitemplate-io createImage=w createPdf=w createPdfFromHtml=w createPdfFromUrl=w deleteObject=d getAccountInformation=r listObjects=r
apollo enrichCompany=r matchPerson=r newsArticlesSearch=r organizationJobPostings=r organizationSearch=r peopleSearch=r
appfollow addUser=w replyToReview=o
approval create_approval_links=W! wait_for_approval=r!
asana create_task=w
ask-handle create_lead=w create_message=o:room list_leads=r list_rooms=r
asknews asknewsChatCompletion=r createANewsletter=o:audienceId generateNewsKnowledgeGraph=r getArticleById=r searchNews=r searchStories=r updateANewsletter=w
assembled OOO=w add_shift=w custom_graphql=i delete_OOO=d get_user_schedule=r update_OOO=w
assemblyai deleteTranscript=d getLemurResponse=r getRedactedAudio=r getSubtitles=r getTranscript=r getTranscriptParagraphs=r getTranscriptSentences=r lemurTask=r listTranscripts=r purgeLemurRequestData=d transcribe=w uploadFile=w wordSearch=r
attio create_entry=w create_note=w create_record=w create_task=w delete_task=d find_list_entry=r find_record=r get_call_transcript=r get_record=r get_task=r list_tasks=r update_entry=w update_record=w update_task=w
autocalls addLead=o:phone_number campaignControl=o deleteLead=d makePhoneCall=o:phone_number sendSms=o:to
avian ask_avian=r
avoma create_call=w get_meeting_recording=r get_meeting_transcription=r
aws-bedrock generate_content_from_image=r generate_embeddings=r generate_image=r send_prompt=r
azure-ad add_member_to_group=w add_or_remove_user_license=w create_group=w create_user=w delete_group=d delete_user=d get_enabled_users=r get_group_by_id=r get_group_custom_attributes=r get_user_by_id=r list_enabled_users=r list_group_members=r list_users=r reset_custom_attributes=d revoke_sign_in_session=w update_user=w
azure-blob-storage addTagsToBlob=w createBlob=w createContainer=w deleteBlob=d deleteContainer=d findBlobs=r listBlobs=r listContainers=r readBlob=r
azure-communication-services send_email=o:to
azure-devops add_comment=w create_work_item=w get_work_item=r list_work_items=r update_work_item=w
azure-openai ask_gpt=r
backblaze read-backblaze-file=r upload-backblaze-file=w
bannerbear bannerbear_create_image=w
barcode-lookup searchByBarcode=r
baremetrics create_customer=w create_plan=w create_subscription=w update_customer=w
base44 create_entity=w find_entity=r find_or_create_entity=w
baserow baserow_aggregate_field=r baserow_batch_create_rows=w baserow_batch_delete_rows=d baserow_batch_update_rows=w baserow_clean_row=w baserow_create_row=w baserow_delete_row=d baserow_find_row=r baserow_get_row=r baserow_list_rows=r baserow_update_row=w baserow_upload_file=w
beamer create_beamer_post=o create_new_comment=o create_new_feature_request=o create_vote=w
beebole create_company=w create_multiple_time_entries=w create_person=o:email create_project=w create_subproject=w deactivate_subproject=w delete_multiple_time_entries=d
beehiiv add_subscription_to_automation=w create_subscription=o:email delete_subscription=d list_automations=r list_posts=r list_subscriptions=r update_subscription=w
bettermode assign_badge=w create_discussion=o create_question=o revoke_badge=w
bexio create_company=w create_manual_entry=f create_person=w create_product=w create_project=w create_sales_invoice=f create_sales_order=f create_sales_quote=w create_time_tracking=w export_invoice_pdf=r find_account=r find_company=r find_country=r find_product=r search_invoice=r search_order=r search_quote=r send_sales_invoice=o:recipient_email update_company=w update_person=w update_product=w
bigcommerce createAProduct=w createBlogPost=o createCustomer=w createCustomerAddress=w deleteAProduct=d findOrCreateCustomer=w findOrCreateCustomersAddress=w findOrCreateProduct=w getOrder=r listCategories=r listOrders=r searchCustomer=r searchCustomerAddress=r searchProduct=r updateAProduct=w
bigin-by-zoho createCall=w createCompany=w createContact=w createEvent=w createPipeline=w createTask=w searchCompanyRecord=r searchContactRecord=r searchPipelineRecord=r searchProductRecord=r searchUser=r updateCompany=w updateContact=w updateEvent=w updatePipeline=w updateTask=w
bika bika_create_record=w bika_delete_record=d bika_find_record=r bika_find_records=r bika_update_record=w
billplz create_bill=f:email get_bill=r
binance fetch_crypto_pair_price=r
bitly archive_bitlink=d create_bitlink=w create_qr_code=w get_bitlink_details=r update_bitlink=w
bland-ai get_call_details=r list_calls=r send_call=o:phoneNumber
blockscout check_redirect=r get_address_blocks_validated=r get_address_by_hash=r get_address_coin_balance_history=r get_address_coin_balance_history_by_day=r get_address_counters=r get_address_internal_transactions=r get_address_logs=r get_address_token_balances=r get_address_token_transfers=r get_address_tokens=r get_address_transactions=r get_address_withdrawals=r get_addresses=r get_block_by_hash=r get_block_transactions=r get_block_withdrawals=r get_blocks=r get_main_page_blocks=r get_main_page_transactions=r get_token_by_address=r get_token_counters=r get_token_holders=r get_token_instances=r get_token_transfers=r get_tokens=r get_transaction_by_hash=r get_transaction_internal_transactions=r get_transaction_logs=r get_transaction_raw_trace=r get_transaction_state_changes=r get_transaction_summary=r get_transaction_token_transfers=r get_transactions=r search=r
bluesky createPost=o:audience findPost=r findThread=r likePost=w repostPost=o
bocha-search web_search=r
bokio addLineItemToInvoice=w createAJournalEntry=w createAnItem=w createCustomer=w createInvoice=w findCustomer=r getAJournalEntry=r getAnInvoice=r getDraftInvoiceByCustomerName=r updateAnInvoice=w
bolna makePhoneCall=o:recipientPhoneNumber
bonjoro add_greet=w
bookedin bulkDeleteLeads=d createLead=w deleteLead=d getLead=r getLeadStats=r getLeads=r updateLead=w
brave-search web_search=r
brilliant-directories create_new_user=w
browse-ai get-task-details=r list-robots=r run-robot=w
browserless capture_screenshot=r generate_pdf=r get_website_performance=r run_bql_query=i scrape_url=r
bubble bubble_create_thing=w bubble_delete_thing=d bubble_get_thing=r bubble_list_things=r bubble_update_thing=w
buffer create_idea=w create_post=i
bumpups generateCreatorDescription=r generateCreatorHashtags=r generateCreatorTakeaways=r generateCreatorTitles=r generateTimestamps=r send_chat=r
bursty-ai runWorkflow=w
buttondown createSubscriber=w listSubscribers=r sendEmail=o
camb-ai create_text_to_sound=w create_text_to_speech=w create_transcription=w create_translation=w
campaign-monitor add_subscriber_to_list=w find_subscriber=r unsubscribe_subscriber=d update_subscriber_details=w
canny create_post=w create_vote=w delete_vote=d list_posts=r retrieve_post=r
canva create_design=w export_design=w find_design=r get_asset=r get_design=r get_folder=r import_design=w move_folder_item=w upload_asset=w
capsule-crm add_note_to_entity=w create_contact=w create_opportunity=w create_project=w create_task=w find_contact=r find_opportunity=r find_project=r update_contact=w update_opportunity=w
captain-data getJobResults=r launchWorkflow=w
carbone carbone_delete_template=d carbone_list_categories=r carbone_list_tags=r carbone_list_templates=r carbone_update_template=w carbone_upload_template=w
cartloom create_discount=w get_all_discounts=r get_discount=r get_order=r get_orders_by_date=r get_orders_by_email=r get_products=r
cashfree-payments cancel-payment-link=d create-cashgram=f:phone create-order=w create-payment-link=o:customerPhone create-refund=f deactivate-cashgram=f fetch-payment-link-details=r get-all-refunds-for-order=r get-orders-for-payment-link=r
certopus create_credential=o:email
chain-aware auditWalletAddress=r creditScore=r fraudCheck=r rugPullCheck=r walletSegment=r
chainalysis-api checkAddressSanction=r
chaindesk query-agent=w query-datastore=r upload-file=w
chargebee cancel_subscription=f create_customer=w create_subscription=f get_customer=r
chargekeep addOrUpdateContact=w addOrUpdateContact(extended)=o addOrUpdateSubscription=f createInvoice=f createProduct=w
chartly create_chart=r get_chart=r
chat-aid addCustomSources=w askQuestions=w getCustomSourceById=r
chat-data create_chatbot=w delete_chatbot=d retrain_chatbot=w send_message=w update_chatbot_settings=w upload_file=w
chatbase create_chatbot=w list_chatbots=r message_chatbot=w search_conversations=r
chatfly send_message=w
chatling create_chatbot=w send_message=w
chatnode ask-chatbot=w
chatsistant sendMessage=w
chatwoot send_message=o:conversationId
checkout create_customer=w create_payment=f create_payment_link=f:customer_email get_payment_actions=r get_payment_details=r refund_payment=f update_customer=w
chess-com get_daily_puzzle=r get_player_profile=r get_player_stats=r
circle add_member_to_space=w create_comment=o create_post=o find_member_by_email=r get_member_details=r get_post_details=r
clarifai ask-llm=r audio_text_model=r generate-igm=r image_text_model=r post_inputs=w text_classifier_model=r text_text_model=r visual_classifier_model=r workflow_predict=r
claude ask_claude=r extract-structured-data=r
clearout instant_verify=r
clearoutphone findPhoneNumberCarrier=r findPhoneNumberIsMobile=r validatePhoneNumber=r
clicdata insert_row=w refresh_table=w
clickfunnels applyTagToContact=w createOpportunity=w enrollAContactIntoACourse=w removeTagFromContact=w searchContacts=r updateOrCreateContact=w
clicksend create_contact=w create_contact_list=w delete_contact=d find_contact_by_email=r find_contact_by_phone=r find_contact_lists=r send_mms=o:to send_sms=o:messages update_contact=w
clickup create_channel=w create_channel_in_space_folder_list=w create_folderless_list=w create_message=o:channel_id create_message_reaction=w create_message_reply=o:message_id create_subtask=w create_task=w create_task_comments=o:assignee_id create_task_from_template=w delete_message=d delete_message_reaction=d delete_task=d get_accessible_custom_fields=r get_channel=r get_channel_messages=r get_channels=r get_list=r get_list_task=r get_message_reactions=r get_message_replies=r get_space=r get_spaces=r get_task_by_name=r get_task_comments=r list_workspace_tasks=r list_workspace_time_entries=r set_custom_fields_value=w update_message=w update_task=w
clockify create-task=w create-time-entry=w find-running-timer=r find-task=r find-time-entry=r start-timer=w stop-timer=w
clockodo create_absence=w create_customer=w create_entry=w create_project=w create_service=w create_user=w delete_absence=d delete_customer=d delete_entry=d delete_project=d delete_service=d delete_user=d get_absence=r get_customer=r get_entry=r get_project=r get_service=r get_team=r get_user=r list_absences=r list_customers=r list_entries=r list_projects=r list_services=r list_teams=r list_users=r update_absence=w update_customer=w update_entry=w update_project=w update_service=w update_user=w
close create_contact=w create_lead=w create_opportunity=w find_contact=r find_lead=r
cloudconvert archive_file=w capture_website=w convert_file=w download_file=r merge_pdf=w optimize_file=w
cloudinary createUsageReport=r deleteResource=d findResourceByPublicId=r transformResource=w uploadResource=w
cloutly sendReviewInvite=o:email
coda create-row=w find-row=r get-row=r get-table=r list-tables=r update-row=w upsert-row=w
cody create_conversation=w create_document_from_text=w find_bot=r find_conversation=r send_message=w upload_file=w
cognito-forms create_entry=w delete_entry=d get_entry=r update_entry=w
cohere generate_text=r
cometapi ask-cometapi=r
comfyicu get-run-output=r get-run-status=r list-workflows=r submit-workflow-run=w
confluence add-comment=o add-label=w create-page=w create-page-from-template=w delete-page=d download-attachment=r find-page-by-title=r find-user=r get-page-by-url=r getPageContent=r list-attachments=r list-comments=r list-spaces=r move-page=w publish-draft=w remove-label=w reply-to-comment=o search-pages=r update-page=w upload-attachment=w
connections read_connection=r
connectuc create-contact=w do-not-disturb=w find-cdr=r initiate-call=o:toNumber send-sms=o:recipients update-cdr=w
constant-contact create_or_update_contact=w
contentful contentful_record_create=w contentful_record_get=r contentful_record_search=r
contextual-ai create_agent=w create_datastore=w generate=r ingest_document=w invite_users=o:users parse_file=w query_agent=w
contiguity send_imessage=o:to send_text=o:to
convertkit broadcasts_broadcast_stats=r broadcasts_create_broadcast=w broadcasts_delete_broadcast=d broadcasts_get_broadcast=r broadcasts_list_broadcasts=r broadcasts_update_broadcast=w create_webhook=w custom_fields_create_field=w custom_fields_delete_field=d custom_fields_list_fields=r custom_fields_update_field=w destroy_webhook=d forms_add_subscriber_to_form=w forms_list_form_subscriptions=r forms_list_forms=r purchases_create_multiple_purchases=w purchases_create_purchase=w purchases_get_purchase_by_id=r purchases_list_purchases=r purchases_list_purchases_for_form=r purchases_list_purchases_for_product=r purchases_list_purchases_for_sequence=r purchases_list_purchases_for_subscriber=r sequences_add_subscriber_to_sequence=o:email sequences_list_sequences=r sequences_list_subscriptions_to_sequence=r subscribers_get_subscriber_by_email=r subscribers_get_subscriber_by_id=r subscribers_list_subscribers=r subscribers_list_tags_by_email=r subscribers_list_tags_by_subscriber_id=r subscribers_unsubscribe_subscriber=w subscribers_update_subscriber=w tags_create_tag=w tags_list_subscriptions_to_tag=r tags_list_tags=r tags_remove_tag_from_subscriber_by_email=w tags_remove_tag_from_subscriber_by_id=w tags_tag_subscriber=w
copper convertLead=w createActivity=w createCompany=w createLead=w createOpportunity=w createPerson=w createProject=w createTask=w searchForACompany=r searchForALead=r searchForAPerson=r searchForAProject=r searchForAnActivity=r searchForAnOpportunity=r updateCompany=w updateLead=w updateOpportunity=w updatePerson=w updateProject=w
copy-ai get_workflow_run_outputs=r get_workflow_run_status=r run_workflow=w
coralogix acknowledgeIncidents=w assignIncidents=w closeIncidents=w getIncidentById=r getIncidentEvents=r listIncidents=r resolveIncidents=w sendLogs=w setAlertActive=w
couchbase delete_document=d get_document=r insert_document=w query=r upsert_document=w
coupa add_file_attachment_to_object=w cancel_purchase_order=w close_purchase_order=w create_object=w get_object_by_id=r get_remit_to_addresses_by_object_id=r get_supplier_sites_by_supplier=r grant_approval=w reject_approval=w search_objects=r set_integration_run_status=w update_object=w
crisp add_note=w change_state=w create_update_contact=w find_conversation=r find_user_profile=r
crypto base64-decode=r! base64-encode=r! generate-password=r! hash-text=r! hmac-signature=r! openpgpEncrypt=r! rsa-signature=r!
cryptolens addCustomer=w blockKey=w createKey=w extendLicense=w
csv convert_csv_to_json=r! convert_excel_to_csv=r! convert_json_to_csv=r!
cursor add_followup_instruction=w delete_agent=d find_agent_status=r launch_agent=w
customer-io create_event=w
customgpt createAgent=w createConversation=w deleteAgent=d export_conversation=r findAgent=r findConversation=r sendMessage=w update_agent=w update_settings=w
cyberark activate_user=w add_member_to_group=w change_credentials_bulk=w change_credentials_in_vault=w change_credentials_in_vault_bulk=w create_user=w delete_user=d disable_user=w enable_user=w find_user=r get_password_value=r reconcile_credentials_bulk=w remove_member_from_group=w retrieve_private_ssh_key=r set_next_password_bulk=w update_user=w verify_credentials_bulk=w
dappier lifestyle_news_search=r real_time_web_search=r sports_news_search=r stock_market_data_search=r
dashworks generate-answer=r
data-mapper advanced_mapping=r!
data-summarizer calculateAverage=r calculateSum=r countUniques=r getMinMax=r
datadog sendMultipleLogs=w sendOneLog=w
dataforb2b enrich_company=r enrich_profile=r reasoning_search=r search_companies=r search_people=r typeahead=r
datafuel crawl-website=r get-scrape=r scrape-website=w
date-helper add_subtract_date=r! date_difference=r! extract_date_parts=r! first_day_of_previous_month=r! format_date=r! get_current_date=r! last_day_of_previous_month=r! next_day_of_year=r!
deepgram create_summary=w create_transcription_callback=o:callbackUrl list_projects=r text_to_speech=f
deepl translate_text=r
deepseek ask_deepseek=r
deftform add_form_response=w get_all_forms=r get_form_fields=r get_form_responses=r get_submission_pdf=r get_workspace_details=r update_form_settings=w
delay delayFor=r! delay_until=r!
denser-ai processInputText=r
descript agent_edit=w get_job_status=r get_project=r import_media=w list_projects=r publish_project=w
detecting-ai check_plagiarism=r detect_ai_content=r humanize_text=r
devin create_session=w get_session_details=r send_message=w
digital-ocean create_domain=w create_droplet=f delete_domain=d delete_droplet=d get_domain=r get_droplet=r list_database_clusters=r list_database_events=r list_domains=r list_droplets=r
digital-pilot add_target_account=w remove_target_account=w
dimo attestation-create-vin-vc=w device-definitions-decode-vin=r device-definitions-lookup-device-definitions=r identity-custom-query=i identity-get-dcns-by-owner=r identity-get-developer-license-info=r identity-get-developer-shared-vehicles-from-owner=r identity-get-device-definition-by-definitionid=r identity-get-device-definition-by-tokenid=r identity-get-owner-vehicles=r identity-get-reward-history-by-owner=r identity-get-rewards-by-owner=r identity-get-sacd-for-vehicle=r identity-get-total-vehicle-count-for-owner=r identity-get-vehicle-by-dev-license=r identity-get-vehicle-mmy-by-owner=r identity-get-vehicle-mmy-by-tokenid=r identity-total-vehicle-count=r telemetry-available-signals=r telemetry-custom-query=i telemetry-daily-avg-speed=r telemetry-event=r telemetry-max-speed=r telemetry-signals=r telemetry-vin-vc-latest=r token-exchange-get-vehicle-jwt=r vehicle-events-delete-webhook-action=d vehicle-events-list-signals-action=r vehicle-events-list-subscribed-vehicles-action=r vehicle-events-list-vehicle-subscriptions-action=r vehicle-events-list-webhooks-action=r vehicle-events-subscribe-all-vehicles-action=w vehicle-events-subscribe-vehicle-action=w vehicle-events-unsubscribe-all-vehicles-action=w vehicle-events-unsubscribe-vehicle-action=w vehicle-events-upsert-webhook-boolean-action=w vehicle-events-upsert-webhook-event-action=w vehicle-events-upsert-webhook-numeric-action=w
discord add_role_to_member=w ban_guild_member=d createGuildRole=w create_channel=w deleteGuildRole=d delete_channel=d find_channel=r list_guild_members=r remove_ban_from_user=w remove_member_from_guild=d remove_role_from_member=w rename_channel=w request_approval_message=o:channel sendMessageWithBot=o:channel_id send_message_webhook=o
discourse add_users_to_group=w change_user_trust_level=w create_post=o create_topic=o send_private_message=o:target_recipients
dittofeed identify=w screen=w track=w
docsbot askQuestion=r createBot=w createSource=w findBot=r uploadSourceFile=w
doctly convert-pdf-to-text=w
documentpro runExtract=r uploadDocument=w
documerge combine_files=w convert_file_to_pdf=w create_data_route_merge=o create_document_merge=w split_pdf=w
docusign createAndSendEnvelope=i:signers findEnvelopeRecipients=r getDocument=r getEnvelope=r listEnvelopes=r listTemplates=r updateEnvelope=i
drip add_subscriber_to_campaign=o:subscriber apply_tag_to_subscriber=w upsert_subscriber=w
dropbox copy_dropbox_file=w copy_dropbox_folder=w create_new_dropbox_folder=w create_new_dropbox_text_file=w delete_dropbox_file=d delete_dropbox_folder=d downloadFile=r get_dropbox_file_link=r list_dropbox_folder=r move_dropbox_file=w move_dropbox_folder=w search_dropbox=r upload_dropbox_file=w
drupal drupal-call-service=i drupal-create-entity=w drupal-delete-entity=d drupal-get-entity=r drupal-list-entities=r drupal-update-entity=w
dub create_link=w delete_link=d get_link=r list_links=r update_link=w
duckdb createAndQueryDB=i
dumpling-ai crawl_website=r extract_document=r generate_image=w scrape_website=r search_news=r web_search=r
dust addDocument=w addFragmentToConversation=w createConversation=w getConversation=r replyToConversation=w uploadFile=w
easy-peasy-ai customGeneratorText=r generateAiImage=r getAiTranscription=r
echowin createContact=w deleteContact=d findContactByName=r
eden-ai detect_language=r extract_entities=r extract_keywords=r generate_text=r image_generation=r invoice_parser=r moderate_text=r ocr_image=r receipt_parser=r spell_check=r summarize_text=r text_to_speech=r translate_text=r
editionguard send_ebook_download_links=o:customer_email
elastic-email add_contact=w create_campaign=o:recipientListNames create_contact=w create_segment=w list_campaigns=r list_contacts=r send_email=o:recipients unsubscribe_contact=w update_campaign=w update_contact=w
elevenlabs elevenlabs-text-to-speech=r
emailit send_email=o:to
emailoctopus add_or_update_contact=w add_tag_to_contact=w create_list=w find_contact=r remove_tag_from_contact=w unsubscribe_contact=w update_contact_email=w
enrichlayer get_company_id_lookup=r get_company_lookup=r get_company_picture=r get_company_profile=r get_company_search=r get_credit_balance=r get_disposable_email_check=r get_employee_count=r get_employee_listing=r get_employee_search=r get_job_count=r get_job_profile=r get_job_search=r get_person_lookup=r get_person_picture=r get_person_profile=r get_person_search=r get_personal_contact=r get_personal_email=r get_reverse_email_lookup=r get_reverse_phone_lookup=r get_role_lookup=r get_school_profile=r get_student_listing=r get_work_email_lookup=r
esignatures createContract=o:signers
eth-name-service listEnsDomains=r
everhour create-task=w start-timer=w stop-timer=w
exa find_similar_links=r generate_answer=r get_contents=r perform_search=r
extracta-ai extract_file_data=w get_extraction_results=r upload_file=w
facebook-pages create_photo_post=o:page create_post=o:page create_video_post=o:page
famulor addLead=w campaignControl=o createCampaign=w createConversation=w deleteCall=d deleteLead=d generateAiReply=r getCall=r getConversation=r getCurrentUser=r getWhatsAppSenders=r getWhatsAppSessionStatus=r getWhatsAppTemplates=r listCalls=r listConversations=r listLeads=r listPhoneNumbers=r makePhoneCall=o:customerNumber purchasePhoneNumber=f searchAvailablePhoneNumbers=r sendMessage=o sendSms=o:recipient sendWhatsAppFreeform=o:recipient sendWhatsAppTemplate=o:recipient updateLead=w
fathom findTeam=r findTeamMember=r getRecordingSummary=i:destination_url getRecordingTranscript=i:destination_url listMeetings=r
fathom-analytics create_event=w get_aggregation=r get_site=r list_events=r list_sites=r
feathery create_form=w delete_form=d export_submission_pdf=w list_form_submissions=r update_form=w
feedhive create_label=w create_post=w delete_post=d fire_workflow_trigger=w get_post=r list_posts=r update_post=w
fellow get-note=r
figma get_comments=r get_file=r post_comment=w
file-helper change_file_encoding=W! createFile=W! get_file_name=r! read_file=r! unzipFile=W! zipFiles=W!
filetopdf convert_file=r convert_html=r convert_markdown=r get_account=r
fillout-forms findFormByTitle=r getFormResponses=r getSingleResponse=r
fireberry create_record=w delete_record=d find_record=r update_record=w
firecrawl crawl=r crawlResults=r extract=r map=r
fireflies-ai find-meeting-by-id=r find_meeting_by_query=r find_recent_meeting=r get-user-details=r upload_audio=w
flipando getAllApps=r getTask=r runApp=w runAppGenerator=w
fliqr-ai get_fliqr_account_details=r get_fliqr_account_flows=r
flow-helper failFlow=w getRunId=r stopFlow=w
flow-parser upload_document=w
flowise make_prediction=w
flowlu flowlu_create_contact=w flowlu_create_opportunity=w flowlu_create_organization=w flowlu_create_task=w flowlu_delete_contact=d flowlu_delete_opportunity=d flowlu_delete_task=d flowlu_get_task=r flowlu_update_contact=w flowlu_update_opportunity=w flowlu_update_task=w
folk createCompany=w createPerson=w findCompany=r findPerson=r getCompany=r getPerson=r updateCompany=w updatePerson=w
foreplay-co findAds=r findBoards=r findBrands=r getAdById=r getAdsByPage=r
forms return_response=W!
formstack createSubmission=w findFormByNameOrId=r findSubmissionByFieldValue=r getSubmissionDetails=r
fountain create_applicant=w delete_applicant=d get_applicant_details=r get_interview_sessions=r get_opening=r get_stage=r list_applicants=r list_openings=r list_stages=r update_applicant=w
fragment create_task=w delete_task=d get_task=r list_tasks=r update_task=w
free-agent create_contact=w create_task=w
freshdesk get_all_tickets_by_status=r get_contact_from_id=r get_contacts=r get_tickets=r
freshsales freshsales_create_contact=w
freshservice add_note_to_change=i add_note_to_ticket=i create_change=w create_change_task=w create_requester=w create_ticket=w delete_change=d delete_change_task=d request_ticket_approval=o:approver_id update_change=w update_change_task=w
frill create_announcement=i create_comment=i create_follower=w create_idea=w get_comments=r get_ideas=r update_follower=w update_idea=w
front addComment=w addContactHandle=w addConversationLinks=w addConversationTags=w assignUnassignConversation=w createAccount=w createContact=w createDraft=w createDraftReply=w createLink=w findAccount=r findContact=r findConversation=r removeContactHandle=d removeConversationLinks=w removeConversationTags=w sendMessage=o:to sendReply=o:to updateAccount=w updateContact=w updateConversation=d updateLink=w
gameball sendEvent=w
gamma generateGamma=w getGeneration=r
gcloud-pubsub publish_to_topic=w
gender-api getGenderByFirstName=r getGenderByFullName=r getStatistics=r
generatebanners render_template=w
getresponse create-contact=w create-newsletter=o create-or-update-contact=w find-campaign-list=r find-contact=r
ghostcms create_member=w create_post=i find_member=r find_user=r update_member=w
giftbit send_reward=f:contacts
gistly get_transcript=r
gitea create_comment=o create_issue=w update_repo=w
github add_labels_to_issue=w createCommentOnAIssue=o create_branch=w delete_branch=d find_branch=r find_issue=r find_user=r getIssueInformation=r github_create_commit_comment=o github_create_discussion_comment=o github_create_gist=w github_create_issue=w github_create_pull_request_review_comment=o lockIssue=w rawGraphqlQuery=i unlockIssue=w update_issue=w
gitlab create_issue=w
gladia createTranscription=w uploadAFile=w
glide add-rows=w delete-row=d get-rows=r list-tables=r update-row=w
gmail create_draft_reply=w gmail_get_mail=r gmail_get_thread=r gmail_search_mail=r reply_to_email=o request_approval_in_mail=o:receiver send_email=o:receiver
goodmem create_memory=w create_space=w delete_memory=d get_memory=r retrieve_memories=r
google-bigquery create_rows=w delete_rows=d find_one_row=r find_or_create_row=w get_rows_for_job=r import_data=w run_query=i update_rows=i
google-calendar addCalendarToCalendarlist=w create_google_calendar_event=o:attendees create_quick_event=o delete_event=d google-calendar-add-attendees=o:attendees google_calendar_find_busy_free_periods=r google_calendar_get_event_by_id=r google_calendar_get_events=r update_event=w
google-cloud-storage clone_object=w create_bucket=w create_bucket_acl=w create_bucket_default_object_acl=w create_object_acl=w delete_bucket_acl=w delete_bucket_default_object_acl=w delete_empty_bucket=d delete_object=d delete_object_acl=w search_buckets=r search_objects=r
google-contacts add_contact=w search_contact=r update_contact=w
google-docs append_text=w create_document=w create_document_based_on_template=w google-docs-find-document=w read_document=r
google-drive create_new_gdrive_file=w create_new_gdrive_folder=w delete_gdrive_file=d delete_permissions=w duplicate_file=w get-file-or-folder-by-id=r google-drive-move-file=w list-files=r read-file=r save_file_as_pdf=w search-folder=r set_public_access=w trash_gdrive_file=w update_permissions=o:user_email upload_gdrive_file=w
google-gemini chat_gemini=r create_video=w generate_content=r generate_content_from_image=r generate_content_with_filesearch=r text-to-speech=w
google-my-business create-reply=o
google-search search=r
google-search-console add_site=w delete_site=d list_sitemaps=r list_sites=r search_analytics=r submit_sitemap=w urlInspection=r
google-sheets clear-rows=d clear_sheet=d copy-worksheet=w create-column=w create-spreadsheet=w create-worksheet=w delete-multiple-rows=d delete-worksheet=d delete_row=d export_sheet=r find-or-create-row=w find-or-create-worksheet=w find-worksheet=r find_row_by_num=r find_rows=r find_spreadsheets=r format-row=w get-many-rows=r get_next_rows=w google-sheets-insert-multiple-rows=w insert-row-at-top=w insert_row=w read-data-range=r rename-worksheet=w update-multiple-rows=w update_row=w
google-slides generate_from_template=w get_presentation=r refresh_sheets_charts=w
google-tasks add_task=w
google-vertexai generate_content=r generate_image=r
googlechat addASpaceMember=w findMember=r getDirectMessageDetails=r getMessageDetails=r searchMessages=r sendAMessage=o:privateMessageViewer
gorgias create_gorgias_ticket=o:toAddress create_gorgias_ticket_message=o:toAddress get_gorgias_customer=r get_gorgias_ticket=r list_gorgias_tickets=r update_gorgias_ticket=w
gotify send_notification=o
gptzero-detect-ai scanFile=r scanText=r
granola get_note=r list_notes=r
graphql send_request=i!
greenhouse create_candidate=w create_candidate_note=w create_prospect=w find_candidate=r find_due_scorecard=r find_or_create_candidate=w update_candidate=w
greenpt chatCompletion=r createEmbeddings=r transcribeAudio=r
greip asn_lookup=r bin_lookup=r email_validation=r ip_lookup=r phone_validation=r profanity_detection=r
griptape createAssistantRun=w createStructureRun=w getAssistantRun=r getStructureRun=r
grist grist-create-record=w grist-search-record=r grist-update-record=w grist-upload-attachments-to-document=w
grok-xai ask_grok=r categorize_text=r extract_data_from_text=r generate_image=r
groq ask-ai=r transcribe-audio=r translate-audio=r
guidelite sendAPrompt=w
harvest get_clients=r get_projects=r get_users=r reports-uninvoiced=r
hashi-corp-vault delete_secret=d list_secrets=r read_secret=r write_secret=w
hastewire detect-text=r humanize-text=r
heartbeat heartbeat_create_user=w
hedy create-context=w create-topic=w delete-context=d delete-topic=d get-context=r get-highlight=r get-session=r get-todo=r get-topic=r list-contexts=r list-highlights=r list-session-highlights=r list-session-todos=r list-sessions=r list-todos=r list-topic-sessions=r list-topics=r update-context=w update-topic=w
help-scout add_note=w create_conversation=o:customerEmail create_customer=w find_conversation=r find_customer=r find_user=r send_reply=o:customerEmail update_customer_properties=w
heygen create-video-from-template=w list_avatars=r list_videos=r list_voices=r retrieve-translated-video-status=r retrieve_sharable_video_url=w retrieve_video_status=r translate_video=w upload_asset=w
heymarket-sms createOrUpdateContact=w sendCustomMessage=o:phone_number sendTemplateMessage=o:phone_number updateList=w
hootsuite create_message=o:socialProfileIds delete_message=d get_message=r
housecall-pro add_job_attachment=w add_job_line_item=w add_job_note=w add_job_tag=w bulk_update_job_input_materials=w bulk_update_job_line_items=w convert_lead_to_estimate_or_job=w create_customer=w create_customer_address=w create_estimate=w create_estimate_option_attachment=w create_estimate_option_link=w create_estimate_option_note=w create_job=w create_job_appointment=w create_job_link=w create_lead=w delete_estimate_option_note=d delete_job_appointment=d delete_job_line_item=d delete_job_note=d delete_job_schedule=d dispatch_job_to_employees=w get_customer=r get_customer_address=r get_customer_addresses=r get_customers=r get_estimate=r get_estimates=r get_job=r get_job_appointments=r get_job_input_materials=r get_job_invoices=r get_job_line_items=r get_jobs=r get_lead=r get_leads=r lock_job=w lock_jobs=w remove_job_tag=w update_customer=w update_estimate_option_schedule=o update_job_appointment=w update_job_line_item=w update_job_schedule=o
http parse_url=r! send_request=i!
http-oauth2 send-oauth2-request=i
hubspot add-contact-to-workflow=w add_contact_to_list=w create-associations=w create-blog-post=o create-company=w create-contact=w create-custome-object=w create-deal=w create-line-item=w create-or-update-contact=w create-page=o create-product=w create-ticket=w delete-page=d find-associations=r find-company=r find-contact=r find-custom-object=r find-deal=r find-line-item=r find-product=r find-ticket=r get-company=r get-contact=r get-custom-object=r get-deal=r get-line-item=r get-owner-by-email=r get-owner-by-id=r get-page=r get-pipeline-stage-details=r get-product=r get-ticket=r remove-associations=w remove-contact-from-list=w remove-email-subscription=w update-company=w update-contact=w update-custome-object=w update-deal=w update-line-item=w update-product=w update-ticket=w upload-file=w
hugging-face chat_completion=r create_image=r document_question_answering=r image_classification=r language_translation=r object_detection=r text_classification=r text_summarization=r
hume-ai analyze_emotions_from_url=w create_voice=w delete_voice=d generate_speech_from_file=w generate_text_to_speech=r get_emotion_results=r
hunter add-recipients=w count-emails=r create-lead=w delete-lead=d find-email=r get-lead=r search-leads=r update-lead=w verify-email=r
hystruct create_job=w
ibm-cognose copy_content_object=w create_data_source=w delete_data_source=d get_content_object=r get_data_source=r move_content_object=w update_content_object=w update_data_source=w
iloveapi compress_pdf=r create_signature_request=o:signers download_audit_trail=r download_signed_files=r extract_text_pdf=w get_signature_status=r html_to_pdf=w increase_expiration_days=w jpg_to_pdf=w merge_pdf=w ocr_pdf=w office_to_pdf=w page_numbers_pdf=w pdf_to_jpg=w protect_pdf=w repair_pdf=w rotate_pdf=w send_signer_reminder=o split_pdf=w unlock_pdf=w void_signature=d watermark_pdf=w
image-helper compress_image=W! convert_image_format=W! crop_image=W! get_meta_data=r! image_to_base64=r! resize_image=W! rotate_image=W!
image-router createImage=w imageToImage=w
imap copy_email=w delete_email=d mark_email_read=w move_email=w
influencers-club enrichCreatorByEmail=r enrichCreatorByHandle=r findSimilarCreator=r
insightly create_record=w delete_record=d find_records=r get_record=r update_record=w
insighto-ai add_text_blob=w create_campaign=o make_outbound_call=o:to upsert_contact=w
insta-charts generate_chart_image=w
instabase converse_with_document=r create_conversation=w
instagram-business upload_photo=o:page upload_reel=o:page
instantly-ai add_lead_to_campaign=w create_campaign=w create_lead_list=w search_campaigns=r search_leads=r
instasent add_event=w add_or_update_contact=w delete_contact=d
intercom add-note-to-user=w add-or-remove-tag-on-company=w add-or-remove-tag-on-contact=w add-or-remove-tag-on-conversation=w addNoteToConversation=w assignConversationAction=w create-article=o create-conversation=o:contactId create-data-event=w create-or-update-company=w create-or-update-lead=w create-or-update-user=w create-ticket=w create-user=w find-company=r find-conversation=r find-lead=r find-or-create-company=w find-or-create-lead=w find-user=r get-conversation=r list-all-tags=r replyToConversation=o:conversationId send_message=o:to update-ticket=w
intruder addTarget=w searchForATarget=r searchForAnIssue=r searchForAnIssueOccurrence=r startScan=w
invoiceninja action_recurring_invoice=i create_client=w create_invoice=f create_task=w exists_task=r
jina-ai classify_content=r deepsearch_query=r extract_webpage_content=r train_custom_classifier=w web_search_summarization=r
jira-cloud add-watcher-to-issue=o:userId add_issue_attachment=w add_issue_comment=o assign_issue=w create_issue=w delete_issue_comment=d find-user=r get-issue-attachment=r get_issue=r link-issues=w list_issue_comments=r markdownToJiraFormat=r search_issues=r transition_issue=w update_issue=w update_issue_comment=o
jira-data-center add-watcher-to-issue=o:userId add_issue_attachment=w add_issue_comment=o assign_issue=w create_issue=w delete_issue_comment=d find-user=r get-issue-attachment=r get_issue=r link-issues=w list_issue_comments=r search_issues=r update_issue=w update_issue_comment=o
jogg-ai createAiAvatarPhoto=w createAvatarVideo=w createProductFromProductInfo=w createProductFromUrl=w createVideoFromTemplate=w getGeneratedVideo=r updateProductInfo=w
json convert_json_to_text=r! convert_text_to_json=r! merge_json=r! run_jsonata_query=r!
jungle-grid cancel_job=w estimate_job=r get_artifact_download_url=r get_job_logs=r get_job_runtime=r get_job_status=r list_artifacts=r list_jobs=r submit_job=w
just-invoice create_invoice=f:customerEmail delete_invoice=d get_invoice=r mark_invoice_cancelled=f mark_invoice_final=f mark_invoice_paid=w
kallabot-ai add-contact-to-list=w create-campaign=o:list_id create-contact-list=w delete-campaign=d edit-contact-list=w get-call-details=r get-contacts-from-list=r make-call=o:recipient_phone_number
kapso mark_as_read=o request_user_location=o:to send_audio=o:to send_buttons=o:to send_contact=o:to send_document=o:to send_image=o:to send_list_message=o:to send_location=o:to send_reaction=o:to send_sticker=o:to send_template_message=o:to send_text_message=o:to send_video=o:to
katana create_customer=w create_sales_order=f find_customer=r
kimai create_timesheet=w
kissflow downloadAttachmentFromFormField=r
kizeo-forms create_list_item=w delete_list_item=d edit_list_item=w get_all_list_items=r get_list_definition=r get_list_item=r
klaviyo addProfileToList=w createList=w createProfile=w findListByName=r findProfileByEmailPhone=r findTagByName=r removeProfileFromList=w subscribeProfile=w unsubscribeProfile=w updateProfile=w
klenty add_prospect_to_campaign=o:email create_prospect=w get_prospect=r update_prospect=w
klipy search_clips=r search_gifs=r search_stickers=r
knack create_record=w delete_record=d find_record=r update_record=w
knock delete_user=d get_message=r get_user=r identify_user=w list_messages=r trigger_workflow=o:recipients
kommo create_contact=w create_lead=w find_company=r find_contact=r find_lead=r update_contact=w update_lead=w
krisp-call addContact=w deleteContacts=d sendMms=o:to_number sendSms=o:to_number
kudosity addUpdateContact=w cancelSms=w deleteContact=d formatNumber=r getSmsInfo=r sendSms=o:recipient
kustomer create-conversation=w create-customer=w get-custom-objects=r get-customer=r update-conversation=w
lead-connector add_contact_to_campaign=w add_contact_to_workflow=w add_note_to_contact=w create_contact=w create_opportunity=w create_task=w search_contacts=r update_contact=w update_opportunity=w update_task=w
leap-ai getAWorkflowRun=r runAWorkflow=w
leexi get-call=r
lemlist addCustomVariablesOnLead=w addLeadToACampaign=w markLeadFromAllCampaignAsInterested=w markLeadFromAllCampaignsAsNotInterested=w markLeadFromOneCampaignAsInterested=w markLeadFromOneCampaignAsNotInterested=w pauseLeadFromAllOrSpecificCampaigns=w removeLeadFromACampaign=w removeLeadFromUnsubscribeList=w resumeLeadFromAllOrSpecificCampaigns=w searchLead=r unsubscribeALead=w updateLeadFromCampaign=w
lemon-squeezy create_checkout=w get_order=r list_customers=r list_orders=r list_products=r list_subscriptions=r
letmepost get_post=r list_accounts=r list_media=r publish_post=o:accounts
lets-calendar addContactToCampaign=w
letta createAgentFromTemplate=w createIdentity=w getIdentities=r sendMessageToAgent=o:agentId
lever addFeedbackToOpportunity=w getOpportunity=r listOpportunityFeedback=r listOpportunityForms=r updateOpportunityStage=w
lightfunnels cancel_order=f create_customer=w create_product=w get_customer=r get_funnel=r get_order=r get_product=r list_customers=r list_orders=r list_products=r
linear linear_create_comment=o linear_create_issue=w linear_create_project=w linear_update_issue=w linear_update_project=w rawGraphqlQuery=i
linka addOrUpdateContact=w addOrUpdateContactExtended=o addOrUpdateSubscription=f createInvoice=f createProduct=w
linkedin create_company_update=o:company create_share_update=o
linkup fetch=r search=r
linkupapi check_invitation_status=r get_account=r get_company=r get_conversation=r get_my_profile=r get_profile=r list_accounts=r search_companies=r search_people=r send_connection_request=o:profileUrl send_message=o:profileUrl
llmrails search=r
lobstermail create_inbox=w delete_inbox=d get_account=r get_email=r get_inbox=r list_emails=r list_inboxes=r search_emails=r send_email=o:to
localai ask_localai=r
lofty createLead=w createTransaction=w updateLead=w updateTransaction=w
logrocket identifyUser=w requestHighlights=w
logsnag createEvent=w
lokalise createComment=w createKey=w createProject=w createTask=w deleteKey=d retrieveAComment=r retrieveAKey=r retrieveAProject=r retrieveTranslation=r updateKey=w updateTranslation=w
loops create_contact=w delete_contact=d find_contact=r send_event=o:email send_transactional_email=o:email
lusha enrich_companies=r search_companies=r
magical-api get_company_data=r get_profile_data=r parse_resume=r review_resume=r score_resume=r
magicslides createPptFromText=w createPptFromTopic=w createPptFromYoutube=w
mailchain getAuthenticatedUser=r sendEmail=o:to
mailchimp add_member_to_list=w add_note_to_subscriber=w add_subscriber_to_tag=w archive_subscriber=w create_audience=w create_campaign=w create_custom_event=w create_tag=w find_campaign=r find_customer=r find_subscriber=r find_tag=r get_campaign_report=r remove_subscriber_from_tag=w send_campaign=o unsubscribe_email=w update_member_in_list=w
mailer-lite add_or_update_subscriber=w add_subscriber_to_group=w find_subscriber=r remove_subscriber_from_group=w
mailercheck verifyAnEmailAddress=r
maileroo sendEmail=o:to sendFromTemplate=o:to verifyEmail=r
mailgun add_mailing_list_member=w delete_bounces_bulk=d get_domain_health=r get_domain_stats=r get_events=r list_bounces=r send_email=o:to validate_email=r
mailjet send_email=o:toEmails
manus create_task=w delete_task=d get_task=r update_task=w
manychat addTagToUser=w createSubscriber=w findUserByCustomField=r findUserByName=r removeTagFromUser=w sendContentToUser=o:subscriber_id setCustomField=w
mastodon post_status=o
math-helper addition_math=r! division_math=r! generateRandom_math=r! modulo_math=r! multiplication_math=r! subtraction_math=r!
matomo add_annotation=w
matrix send_message=o:room_alias
mattermost send_message=o:channel_id
mcp reply_to_mcp_client=r
mcp-client call-tool=i
medullar addSpaceRecord=w askSpace=r createSpace=w deleteSpace=d listSpaces=r renameSpace=w
meetgeek-ai getHighlights=r getMeetingDetails=r getMeetingsSummaryInsights=r getTeamMeetings=r getTranscript=r uploadRecording=w
meistertask create_attachment=w create_label=w create_task=w create_task_label=w find_attachment=r find_label=r find_or_create_attachment=w find_or_create_label=w find_or_create_task=w find_person=r find_task=r update_task=w
mem create_mem=w create_note=w delete_note=d
mempool-space get_address_details=r get_address_transactions=r get_address_transactions_chain=r get_address_transactions_mempool=r get_address_utxo=r get_block=r get_block_header=r get_block_height=r get_block_raw=r get_block_status=r get_block_timestamp=r get_block_tip_hash=r get_block_tip_height=r get_block_transaction_id=r get_block_transaction_ids=r get_block_transactions=r get_blocks_bulk=r get_difficulty_adjustment=r get_historical_price=r get_mempool_blocks_fees=r get_price=r get_recommended_fees=r get_transaction=r get_transaction_hex=r get_transaction_merkle_proof=r get_transaction_merkleblock_proof=r get_transaction_outspend=r get_transaction_outspends=r get_transaction_raw=r get_transaction_rbf_timeline=r get_transaction_status=r get_transaction_times=r post_transaction=f validate_address=r
messagebird listMessages=r send-sms=o:recipient
metabase embedQuestion=w getDashboardQuestions=r getQuestion=r getQuestionPngPreview=r
metatext classify_text=r extract_text=r finetune_model=w
microsoft-365-people createContact=w createContactFolder=w deleteContact=d getContactFolder=r searchContacts=r updateContact=w
microsoft-365-planner createBucket=w createPlan=w createTask=w deleteBucket=d deleteTask=d findAPlan=r findTask=r getABucket=r updateBucket=w updatePlan=w updateTask=w
microsoft-copilot chatWithCopilot=w retrieveGroundingData=r searchCopilot=r
microsoft-dynamics-365-business-central create-record=w delete-record=d get-record=r search-records=r update-record=w
microsoft-dynamics-crm dynamics_crm_create_record=w dynamics_crm_delete_record=d dynamics_crm_get_record=r dynamics_crm_update_record=w
microsoft-excel-365 add_worksheet=w append_multiple_rows=w append_row=w append_table_rows=w clear_column=d clear_range=d clear_row=d clear_worksheet=d convert_to_range=d copy_worksheet=w createWorkbook=w create_table=w create_worksheet=w delete_row=d delete_table=d delete_workbook=d delete_worksheet=d find-workbook=r find-worksheet=r get-worksheet-columns=r getRowById=r get_range=r get_table_columns=r get_table_rows=r get_workbooks=r get_worksheet_rows=r get_worksheets=r lookup_table_column=r update_row=w
microsoft-onedrive copy_file=w list_files=r list_folders=r upload_onedrive_file=w
microsoft-onenote append_note=w create_image_note=w create_note_in_section=w create_notebook=w create_page=w create_section=w
microsoft-outlook addLabelToEmail=w createDraftEmail=w downloadAttachment=r findEmail=r forwardEmail=o:recipients moveEmailToFolder=w removeLabelFromEmail=w reply-email=o:ccRecipients request_approval_in_mail=o:recipients send-email=o:recipients sendDraftEmail=o
microsoft-outlook-calendar create_event=w delete_event=d list_events=r
microsoft-power-bi create_dataset=w
microsoft-sharepoint microsoft_sharepoint_copy_item=w microsoft_sharepoint_copy_item_within_site=w microsoft_sharepoint_create_folder=w microsoft_sharepoint_create_list=w microsoft_sharepoint_create_list_item=w microsoft_sharepoint_delete_list_item=d microsoft_sharepoint_find_file=r microsoft_sharepoint_find_site=r microsoft_sharepoint_get_folder_contents=r microsoft_sharepoint_get_site_information=r microsoft_sharepoint_move_file=w microsoft_sharepoint_publish_page=w microsoft_sharepoint_search_list_item=r microsoft_sharepoint_update_list_item=w microsoft_sharepoint_upload_file=w
microsoft-teams microsoft_teams_create_channel=w microsoft_teams_create_chat_and_send_message=o:members microsoft_teams_create_private_channel=w microsoft_teams_delete_chat_message=d microsoft_teams_find_channel=r microsoft_teams_find_team_member=r microsoft_teams_get_channel_message=r microsoft_teams_get_chat_message=r microsoft_teams_get_meeting_recording=r microsoft_teams_get_meeting_transcript=r microsoft_teams_reply_to_channel_message=o:channelId microsoft_teams_send_channel_message=o:channelId microsoft_teams_send_chat_message=o:chatId request_approval_direct_message=o:chatId request_approval_in_channel=o:channelId
microsoft-teams-bot microsoft_teams_send_channel_message_as_bot=o:channelId
microsoft-todo add_attachment=w complete_task=w create_task=w create_task_list=w delete_task=d find_task_by_title=r find_task_list_by_name=r get_task=r list_task_lists=r update_task_list=w
millionverifier verifyEmail=r
mind-studio run_workflow=i
mindee mindee_predict_document=r
missive create_contact=w create_draft_post=i:message_fields create_task=w find_contact=r update_contact=w
mistral-ai create_chat_completion=r create_embeddings=r list_models=r run_ocr=r upload_file=w
mixmax create_code_snippet=w create_contact=w find_contact=r list_code_snippets=r list_contacts=r
mixpanel track_event=w
modelslab text-to-image=w
mollie create_customer=w create_order=f create_payment=f create_payment_link=f create_payment_refund=f search_customer=r search_order=r search_payment=r
monday monday_create_column=w monday_create_group=w monday_create_item=w monday_create_update=w monday_get_board_values=r monday_get_item_column_values=r monday_update_column_values_of_item=w monday_update_item_name=w monday_upload_file_to_column=w
mongodb aggregate_documents=r delete_documents=d find_and_replace_documents=w find_and_update_documents=w insert_documents=w update_documents=w
moonclerk retrivePlan=r
mooninvoice addNewContact=w createCreditNote=f createEstimate=w createExpense=w createInvoice=f createProduct=w createTask=w
motion create-project=w create-task=w find-task=r get-task=r moveTask=w update-task=w
motiontools create1stopBooking=f create2stopBooking=f
moxie-crm moxie_create_client=w moxie_create_project=w moxie_create_task=w
muna-ai create_prediction=w
murf-api list-voices=r text_to_speech=w translateText=r voice-changer-convert=w
mycase-piece create_call=w create_case=w create_case_stage=w create_company=w create_custom_field=w create_document=w create_event=w create_expense=w create_lead=w create_location=w create_note=w create_person=w create_practice_area=w create_referral_source=w create_task=w create_time_entry=w find_call=r find_case=r find_case_stage=r find_company=r find_location=r find_or_create_case=w find_or_create_case_stage=w find_or_create_company=w find_or_create_location=w find_or_create_person=w find_or_create_practice_area=w find_or_create_referral_source=w find_people_group=r find_person=r find_practice_area=r find_referral_source=r find_staff=r make_request=i update_case=w update_company=w update_person=w
mysql delete_row=d execute_query=i find_rows=r get_tables=r insert_row=w update_row=w
netlify get_site=r list_files=r list_site_deploys=r start_deploy=w
netsuite executeDataset=r getCustomer=r getVendor=r runSuiteQL=r
neverbounce verifyEmailAddress=r
nifty create_task=w
ninjapipe add_to_list=w create_budget=w create_budget_expense=w create_company=w create_contact=w create_deal=w create_order=f create_pipeline=w create_product=w create_project=w create_task=w delete_budget=d delete_company=d delete_contact=d delete_deal=d delete_order=d delete_pipeline=d delete_product=d delete_project=d delete_task=d get_budget=r get_company=r get_contact=r get_deal=r get_order=r get_pipeline=r get_product=r get_project=r get_task=r list_budgets=r list_companies=r list_contacts=r list_deals=r list_orders=r list_pipelines=r list_products=r list_projects=r list_tasks=r send_to_databin=i toggle_client_portal=w update_budget=w update_company=w update_contact=w update_deal=w update_order=w update_pipeline=w update_product=w update_project=w update_task=w upsert_contact=w
ninox createRecord=w deleteRecord=d downloadFileFromRecord=r findRecord=r listFilesFromRecord=r updateRecord=w uploadFile=w
nocodb nocodb-create-record=w nocodb-delete-record=d nocodb-get-record=r nocodb-search-records=r nocodb-update-record=w
notion add_comment=o append_to_page=w archive_database_item=w createPage=w create_database_item=w find_page=r getPageOrBlockChildren=r get_page_comments=r list_database_pages=r list_databases=r notion-find-database-item=r restore_database_item=w retrieve_database=r update_database_item=w
ntfy send_notification=o:topic
nuelink createPost=o
octopush-sms addContact=w sendANewSms=o:phone_number
odoo create_record=w custom_odoo_api_call=i get_records=r update_record=w
okta activate_user=o add_user_to_group=w create_user=o deactivate_user=o find_group_by_name=r find_user_by_email=r remove_user_from_group=w suspend_user=w update_user=w
omni-co createADocument=w createASchedule=o:recipients deleteADocument=d deleteASchedule=d editSchedule=o:recipients generateQuery=r moveDocument=w runQuery=r
omnihr generateReport=r get_direct_reports=r get_employee_info=r get_employee_organizational_chart=r get_employee_system_id=r
omnisend create_or_update_contact=o get_contact=r list_campaigns=r list_contacts=r send_customer_event=o:email
oncehub createContact=w findContact=r
oneclickimpact captureCarbon=f cleanOcean=f donateMoney=f plantTrees=f
onfleet clone_task=w complete_task=w create_admin=w create_destination=w create_hub=w create_recipient=w create_task=w create_team=w create_worker=w delete_admin=d delete_task=d delete_team=d delete_worker=d get_admins=r get_container=r get_delegatee_details=r get_destination=r get_hubs=r get_organization=r get_recipient=r get_task=r get_tasks=r get_team=r get_teams=r get_worker=r get_worker_schedule=r update_admin=w update_hub=w update_recipient=w update_task=w update_team=w update_worker=w
open-phone create_contact=w get_call_summary=r send_message=o:to update_contact=w
open-router ask-lmm=r
openai analyze_sentiment=r ask_chatgpt=r classify_text=r create_embedding=r delete_file=d edit_image=w extract-structured-data=r find_file=r generate_image=w list_files=r list_models=r search_embeddings=r text_to_speech=w transcribe=r translate=r upload_file=w vision_prompt=r
openmic-ai createPhoneCall=o:toNumber findBot=r findCall=r getBots=r getCalls=r
opportify analyze-email=r analyze-ip-address=r
oracle-database delete_row=d find_row=r insert_row=w insert_rows=w run_custom_sql=i update_row=w
oracle-fusion-cloud-erp cancel_invoice=w create_invoice=f create_payment=f create_receivables_invoice=f delete_invoice=d delete_journal_batch=d delete_receivables_invoice=d find_invoices=r find_journal_batches=r find_payments=r find_receivables_invoices=r get_invoice=r get_journal_batch=r get_payment=r get_receivables_invoice=r stop_payment=w update_invoice=w update_journal_batch=w update_payment=w update_receivables_invoice=w validate_invoice=w void_payment=f
orimon sendMessage=o:tenantId
outseta add_addon_to_subscription=f add_addon_usage=f add_case=o:personUid add_custom_activity=w add_discount_to_subscription=w add_invoice=f add_invoice_payment=f add_reply=o:caseUid change_account_plan=f create_account=f create_deal=w create_discount=w delete_account=d delete_deal=d delete_person=d extend_trial_subscription=w find_or_add_deal=w find_or_add_person=w get_account=r get_deal=r get_last_payment=r get_person=r get_subscription=r list_accounts=r list_addons=r list_cases=r list_deals=r list_discounts=r list_persons=r list_plans=r list_transactions=r manage_account_membership=w manage_email_list_subscription=o:email process_payment=f remove_cancellation=w send_confirmation_email=o:personUid send_invoice_email=o update_account=w update_account_membership=w update_payment_information=w update_person=w
paddle cancel-subscription=f create-transaction=f get-subscription=r list-customers=r update-subscription=f
pagerduty acknowledge_incident=w create_incident=o get_incident=r list_incidents=r resolve_incident=w
pandadoc createAttachment=w createDocumentFromTemplate=w createOrUpdateContact=w downloadDocument=r findDocument=r getDocumentAttachments=r getDocumentDetails=r
paperform createFormCoupon=w createFormProduct=w createSpace=w deleteFormCoupon=d deleteFormProduct=d deleteFormSubmission=d deletePartialFormSubmission=d findForm=r findFormProduct=r findSpace=r updateFormCoupon=w updateFormProduct=w updateSpace=w
parallel chat_completion=r create_findall_run=w create_task_run=w extract=r get_findall_result=r get_task_run=r get_task_run_result=r search=r
parser-expert get_extracted_data=r upload_document=w
parseur createDocument=w createDocumentFromFile=w findDocument=r getParsedDocumentById=r reprocessDocument=w
pastebin create_paste=o get_paste_content=r
pastefy create_folder=w create_paste=w delete_folder=d delete_paste=d edit_paste=w get_folder=r get_folder_hierarchy=r get_paste=r
paywhirl cancelSubscription=f createCustomer=w getCustomer=r searchCustomersSubscription=r subscribeCustomer=f
pdf addImageToPdf=w addTextToPdf=w convertToImage=w extractPdfPages=w extractText=r imageToPdf=w pdfPageCount=r textToPdf=w
pdf-co add_barcode_to_pdf=w add_image_to_pdf=w add_text_to_pdf=w convert_html_to_pdf=w convert_pdf_to_structured_format=w extract_tables_from_pdf=r extract_text_from_pdf=r search_and_replace_text=w
pdf4me compress_pdf=r convert_to_pdf=r merge_pdfs=r pdf_to_image=r pdf_to_word=r protect_pdf=r split_pdf=r
pdfcrowd html_to_pdf=r url_to_pdf=r
pdfmonkey deleteDocument=d findDocument=r generateDocument=w
peekshot captureScreenshot=r
pendo get_account=r get_visitor=r list_guides=r track_event=w
perplexity-ai ask-ai=r
personal-ai create_chatgpt_instruction=r create_custom_training=w create_memory=w create_message=w get_conversation=r get_document=r update_document=w upload_document=w upload_file=w upload_url=w
phantombuster launchPhantom=w
phone-validator validatePhone=r
photoroom removeBackground=r
pinch-payments add_source_to_payer=w add_subscription=f create_or_update_payer=w create_or_update_scheduled_payment=f create_realtime_payment=f find_event=r find_payer=r find_subscription=r
pinecone create_index=w delete_vector=d get_vector=r search_index=r search_vector=r update_vector=w upsert_vector=w
pinterest createBoard=w createPin=o deletePin=d findBoardByName=r findPin=r updateBoard=w
pipedrive add-follower=w add-labels-to-person=w add-product-to-deal=w attach-file=w create-activity=w create-deal=w create-lead=w create-note=w create-organization=w create-person=w create-product=w find-activity=r find-deal=r find-deals-associated-with-person=r find-lead=r find-notes=r find-organization=r find-person=r find-product=r find-products=r find-user=r get-note=r get-product=r update-activity=w update-deal=w update-lead=w update-organization=w update-person=w update-product=w
placid convert_file_to_url=w create_image=w create_pdf=w create_video=w get_image=r get_pdf=r get_video=r
plausible create_custom_property=w create_goal=w create_shared_link=w create_site=w delete_custom_property=d delete_goal=d delete_site=d get_aggregate_stats=r get_breakdown=r get_realtime_visitors=r get_site=r invite_guest=o:email list_custom_properties=r list_goals=r list_guests=r list_sites=r list_teams=r remove_guest=w update_site=w
plunk get_all_contacts=r get_contact=r send_transactional_email=o:to track_event=w
pocketbase createRecord=w deleteRecord=d getFullList=r getList=r getRecord=r updateRecord=w
podio attach_file=w create_comment=o create_item=w create_status=o create_task=w find_item=r find_task=r update_item=w update_task=w
pollybot-ai create_lead=w delete_lead=d get_Lead=r list_leads=r update_lead=w
polydoc capture_screenshot=w convert_to_pdf=w generate_einvoice=w
postgres run-query=i
posthog create_event=w create_project=w get_feature_flags=r list_persons=r
postiz create_post=i delete_post=d find_available_slot=r get_platform_analytics=r get_post_analytics=r list_integrations=r list_posts=r upload_file_from_url=w
postmark get_delivery_stats=r get_email_bounces=r send_email=o:to send_email_with_template=o:to
predict-leads predict-leads_find_companies=r predict-leads_find_companies_by_technology_id=r predict-leads_find_company_by_domain=r predict-leads_find_company_job_openings=r predict-leads_find_connections=r predict-leads_find_connections_by_domain=r predict-leads_find_job_openings=r predict-leads_find_news_by_domain=r predict-leads_find_news_event_by_id=r predict-leads_find_technologies_by_domain=r predict-leads_get_a_job_opening_by_id=r
predis-ai create_content=w
presentation generate_presentations=w
productboard create_feature=w create_note=w get_feature=r update_feature=w
produktly create_changelog_post=o get_company_stats=r get_nps_score=r get_roadmap=r get_widget_stats=r list_changelog_posts=r list_changelogs=r list_feedback_responses=r list_feedback_widgets=r list_nps_responses=r list_nps_widgets=r list_roadmaps=r list_tags=r update_changelog_post=o
promotekit create_affiliate=w create_referral=w find_affiliate=r find_campaign=r find_commission=r find_payout=r find_referral=r list_affiliates=r list_campaigns=r list_commissions=r list_payouts=r list_referrals=r update_affiliate=w
prompthub get_project_head=r list_projects=r run_prompt=w
promptmate get_app_details=r get_job_status=r get_last_results=r get_user_info=r list_apps=r list_projects=r run_app=w use_template=w
provenexpert create_survey_invitation_url=w get_profile=r get_rating_summary=r list_surveys=r send_survey_invitation_email=o:email
proxycurl get_company_profile=r get_person_profile=r lookup_person_email=r search_people=r
pubrio batch_redeem_contacts=r create_monitor=w delete_monitor=d duplicate_monitor=w enrich_company=r find_similar_companies=r get_monitor=r linkedin_company_lookup=r linkedin_person_lookup=r list_monitors=r lookup_advertisement=r lookup_company=r lookup_job=r lookup_lookalike=r lookup_news=r lookup_person=r lookup_technology=r query_batch_redeem=r reveal_contact=r reveal_monitor_signature=r search_ads=r search_companies=r search_jobs=r search_news=r search_people=r test_run_monitor=o:destination_type update_monitor=w
pushbullet sendALink=o sendANote=o
pushover send_notification=o:device
qawafel cancel_order=w create_invoice=w create_merchant=w create_order=w create_product=w get_invoice=r get_order=r get_product=r list_invoices=r list_orders=r list_products=r update_merchant=w update_order_status=w update_product=w
qdrant add_points_to_collection=w collection_infos=r collection_list=r delete_collection=d delete_points=d get_points=r search_points=r
qrcode text_to_qrcode=r
quaderno createContact=w createExpense=f createInvoice=f findContact=r
queue clear-queue=D! pull-from-queue=W! push-to-queue=W!
quickbase create_record=w create_update_records_bulk=w delete_record=d find_or_create_record=w find_record=r update_record=w
quickbooks create_bill=f create_expense=f create_invoice=f find_account=r find_customer=r find_invoice=r find_payment=r find_vendor=r read_aging_report=r record_payment=f
quickzu quickzu_add_product=w quickzu_create_category=w quickzu_create_product_discount=w quickzu_create_promo_code=w quickzu_delete_category=d quickzu_delete_product=d quickzu_get_order_details=r quickzu_list_categories=r quickzu_list_live_orders=r quickzu_list_orders=r quickzu_list_products=r quickzu_update_business_time=w quickzu_update_category=w quickzu_update_order_status=w quickzu_update_product=w
quizell create_customer=w create_product=w get_customer=r list_customers=r search_products=r update_customer=w update_product=w
qwilr create_page=o
rabbitmq sendMessageToExchange=w sendMessageToQueue=w
raia-ai prompt-agent=w upload-agent-file=w
raindrop create_raindrop=w delete_raindrop=w find_raindrops=r get_raindrop=r update_raindrop=w
rapidtext-ai create-prompt=r generate-article=r
razorpay create-payment-link=f:customer_contact
reachinbox addBlocklist=w addEmail=w addLeads=w enableWarmup=w getCampaignAnalytics=r getSummary=r pauseCampaign=w pauseWarmup=w removeEmail=d setSchedule=w startCampaign=o updateLead=w
readwise create_highlight=w get_highlights=r
recall-ai createBot=w retrieveBot=r sendChatMessage=o:to
recurly create_account=w create_subscription=f get_account=r list_subscriptions=r
reddit createRedditPost=o deleteRedditComment=d deleteRedditPost=d editRedditComment=w editRedditPost=w fetchPostComments=r getRedditPostDetails=r retrieveRedditPost=r
rendex render_to_image=r
reoon-verifier bulkEmailVerificationTask=w bulkVerificationResult=r verifyEmail=r
reply-io create_and_push_to_campaign=o:email create_or_update_contact=w delete_contact=d get_contact=r mark_finished=w mark_replied=w push_to_campaign=o:email remove_from_all_campaigns=w remove_from_campaign=w
resend cancel_scheduled_email=w create_audience=w create_broadcast=w create_contact=w create_domain=w delete_audience=d delete_broadcast=d delete_contact=d delete_domain=d get_email_status=r list_audiences=r list_broadcasts=r list_contacts=r list_domains=r list_emails=r reschedule_email=w send_batch_emails=o:emails send_broadcast=o send_email=o:to update_contact=w verify_domain=w
respaid create_new_campaign=w stop_collection_client_paid_directly=w stop_collection_for_direct_instalment_payment=f stop_collection_for_direct_partial_payment=w
respond-io add_comment_to_conversation=w add_tag_to_contact=w assign_or_unassign_conversation=w create_contact=w create_or_update_contact=w delete_contact=d find_contact=r open_conversation=w
retable retable_create_project=w retable_create_record=w retable_create_workspace=w retable_get_projects=r retable_get_retables=r retable_get_workspaces=r
retell-ai create_phone_number=f get_agent=r get_call=r get_phone_number=r get_voice=r make_phone_call=o:toNumber
retune ask_chatbot=w
returning-ai reactMessage=w replyMessage=o:user sendMessage=o:channel
robolly generate_image=w
roe-ai runAgent=w runQuery=i
runware generateImagesFromExistingImage=w generateImagesFromText=w generateVideoFromText=w imageBackgroundRemoval=w
runway cancel_or_delete_task=d generate_image_from_text=w generate_video_from_image=w get_task_details=r
saastic create_charge=w create_customer=w
saleor addOrderNote=w getOrder=r rawGraphqlQuery=i
salesforce add_contact_to_campaign=w add_file_to_record=w add_lead_to_campaign=w create_attachment=w create_case=w create_contact=w create_lead=w create_new_object=w create_note=w create_opportunity=w create_record=w create_task=w delete_opportunity=d delete_record=d export_report=r find_child_records=r find_records_by_query=r get_record_attachments=r run_query=i run_report=r send_email=o:recipientId update_contact=w update_lead=w update_object_by_id=w update_record=w upsert_by_external_id=w upsert_by_external_id_bulk=w
salesloft create_cadence_membership=o:person_id create_note=w create_person=w get_person=r list_cadences=r list_people=r update_person=w
sap-ariba create_contract_workspace=w delete_contract_workspace=d get_active_catalogs=r get_catalog_items=r get_contract_workspace=r get_document_changes=r get_facet_data=r get_pending_approvables=r list_invoices=r list_purchase_order_items=r list_purchase_orders=r search_contract_workspaces=r update_contract_status=w update_contract_workspace=w
sardis check_balance=r check_policy=r list_transactions=r send_payment=f:to set_policy=w
savvycal cancel_event=w create_event=o:attendee_email delete_scheduling_link=d duplicate_scheduling_link=w find_events_by_email=r get_current_user=r get_event=r get_link_slots=r get_scheduling_link=r get_workflow_rules=r list_events=r list_scheduling_links=r list_workflows=r toggle_scheduling_link=w
scrapegrapghai local_scraper=r markdownify=r smart_scraper=r
scrapeless crawl_crawl=r crawl_scrape=r google_search_api=r google_trends_api=r universal_scraping_api=r
seek-table share_report_email=o:to upload_csv=w
segment identifyUser=w
send-it cancel_scheduled_post=w list_accounts=r list_scheduled_posts=r publish_post=o schedule_post=w trigger_scheduled_post=o validate_content=r
sender add_subscriber_to_group=w add_update_subscriber=w create_campaign=w remove_subscriber_from_group=w send_campaign=o unsubscribe_subscriber=w update_subscriber=w
sendfox create-contact=w create-list=w unsubscribe=w
sendgrid create_or_update_contact=w find_list_by_name=r send_dynamic_template=o:to send_email=o:to
sendinblue create_or_update_contact=w
sendpulse add-subscriber=w change-variable-for-subscriber=w delete-contact=d unsubscribe-user=w update-subscriber=w
sendr add_row_to_sheet=w create_webhook=w delete_webhook=d generate_sendr_page=w get_campaign=r get_page_template_variables=r get_sheet=r get_sheet_columns=r get_user_info=r list_campaigns=r list_page_templates=r list_sheets=r list_webhooks=r queue_dynamic_audio=w queue_video_generation=w reveal_webhook_secret=r toggle_webhook=w update_webhook=w
sendy count_subscribers=r create_campaign=o:lists delete_subscriber=d get_brand_lists=r get_brands=r get_subscription_status=r subscribe=w subscribe_multiple_lists=w unsubscribe=w unsubscribe_multiple=w
senja create_testimonial=w delete_testimonial=d get_testimonial=r list_testimonials=r update_testimonial=w
serp-api google_news_search=r google_search=r google_trends_search=r youtube_search=r
serpstat get_keywords=r get_suggestions=r
service-now add_comment=o attach_file_to_record=w count_records=r create_record=w delete_attachment=d delete_record=d find_file=r find_record=r get_catalog_item=r get_knowledge_article=w get_record=r resolve_incident=w search_knowledge_articles=r send_email=o:to submit_catalog_item=w update_record=w
sessions-us create_event=w create_session=w publish_event=o
seven lookup=r send-rcs=o:to send-sms=o:to send-voice-call=o:to
sftp createFolder=w create_file=w deleteFile=d deleteFolder=d listFolderContents=r read_file_content=r renameFileOrFolder=w upload_file=w
shippo create_order=w find_order=r find_shipping_label=r
shopify adjust_inventory_level=w cancel_order=f close_order=w create_collect=w create_customer=o:email create_draft_order=w create_fulfillment_event=w create_order=o:email create_product=w create_transaction=f get_asset=r get_customer=r get_customer_orders=r get_customers=r get_fulfillment=r get_fulfillments=r get_locations=r get_product=r get_product_variant=r get_products=r get_transaction=r get_transactions=r update_customer=o:email update_order=w update_product=w upload_product_image=w
short-io create-country-targeting-rule=w create-short-link=w delete-short-link=d expire-short-link=w get-domain-statistics=r get-link-clicks=r get-short-link-info-by-path=r list-short-links=r update-short-link=w
sign-now cancel_invite=o create_document_from_template_and_send_invite=o:to create_document_from_template_and_send_role_based_invite=o:signers create_document_group_from_template_and_send_invite=o:signers send_invite=o:signers upload_document=w upload_document_and_extract_fields=w
signrequest send_signrequest=o:signers
simpliroute add_visit_items=w bulk_delete_clients=d create_client_property=w create_clients=w create_plan=w create_route=w create_users=w create_vehicle=w create_visits=w delete_route=d delete_vehicle=d delete_visit=d get_clients=r get_drivers=r get_fleets=r get_me=r get_observations=r get_plan_vehicles=r get_plans=r get_route=r get_routes=r get_sellers=r get_skills=r get_tags=r get_user=r get_vehicle=r get_vehicles=r get_visit=r get_visit_detail=r get_visits=r get_zones=r update_user=w update_visit=w update_visit_partial=w
simplybookme cancel_booking=w create_booking=w create_booking_comment=w create_client=w create_detailed_report=r create_note=w delete_client=d find_booking=r find_client=r find_invoice=r
simplyprint add_to_queue=w adjust_filament_weight=w approve_queue_item=w archive_print_jobs=w assign_filament=w cancel_pending_print=w clear_printer_bed=w create_filament=w create_folder=w create_tag=w delete_files=d delete_folders=d delete_queue_group=d delete_tag=d deny_queue_item=o detach_tag=w get_current_user=r get_farm_overview=r get_filament=r get_filament_history=r get_next_queue_items=r get_print_job=r get_printer=r get_printer_notifications=r get_queue_item=r list_custom_fields=r list_files=r list_pending_queue_items=r list_print_history=r list_queue_groups=r list_tags=r move_file=w move_queue_item=w opts.name=i remove_from_queue=d resolve_printer_notification=w revive_queue_item=w save_queue_group=w send_gcode=w set_custom_field_values=w set_printer_out_of_order=w set_queue_item_printers=w skip_print_objects=w start_print=w unarchive_print_jobs=w update_file=w update_queue_item=w upload_and_queue=w upload_file=w upload_to_folder=w
sitespeakai create_finetune=w delete_finetune=d sendQuery=w
skyprep enrollAUserIntoACource=w enrollAUserIntoAUserGroup=w updateUser=w
skyvern cancel-run=w find-workflow=r get-run=r run-agent-task=i run-workflow=i
slack delete-message=d find-user-by-id=r get-file=r get-message=r getChannelHistory=r get_group_by_handle=r invite-user-to-channel=o:userId listUsers=r markdownToSlackFormat=r request_action_direct_message=o:userId request_action_message=o:channel retrieveThreadMessages=r send_channel_message=o:channel send_direct_message=o:userId set-channel-topic=w slack-add-reaction-to-message=w slack-create-channel=w slack-find-user-by-email=r slack-find-user-by-handle=r slack-set-user-status=w slack-update-profile=o:email updateMessage=w update_group_users=w uploadFile=w
slashed encode_video=w
slidespeak create-presentation=w edit-presentation=w get-task-status=r upload-docuemnt=w
slite ask_question=r create_doc=w fetch_doc=r fetch_sub_docs=r index_askx_object=w replace_doc=w search_docs=r update_doc=w
smaily create-or-update-subscriber=w get-subscriber=r
smartlead add_leads_to_campaign=w create_campaign=w get_campaign_statistics=r update_campaign_settings=w
smartsheet add_row_to_sheet=w find_attachment_by_row_id=r find_rows_by_query=r find_sheet_by_name=r update_row=w
smartsuite create_record=w delete_record=d find_records=r get_record=r update_record=w upload_file=w
smoove addOrUpdateSubscriber=w createAList=w findSubscriber=r unsubscribe=w
smsmode sendMessage=o:to
smtp send-email=o:to
snowflake create_dynamic_table=w delete_row=d execute_stored_procedure=i get_row_by_id=r get_table_schema=r insert-row=w insert_multiple_rows=w list_tables=r load_data_from_stage=w runMultipleQueries=i runQuery=i search_rows=r update_row=w upsert_row=w
soap call_method=i
socialkit get_youtube_comments=r get_youtube_details=r get_youtube_summary=r get_youtube_transcript=r
softr createAppUser=w createDatabaseRecord=w deleteAppUser=d deleteDatabaseRecord=d findDatabaseRecord=r updateDatabaseRecord=w
sofya extract=r fetch=r research=r search=r
sperse addOrUpdateContact=w addOrUpdateContactExtended=o addOrUpdateSubscription=w createInvoice=f createProduct=w
splitwise create_expense=f
spotify add_library_items=w add_playlist_items=w create_playlist=w get_playback_state=r get_playlist_info=r get_playlist_items=r get_playlists=r get_saved_tracks=r pause=w play=w remove_library_items=d remove_playlist_items=d reorder_playlist=w search=r set_volume=w update_playlist=w
src name ? name : 'custom_api_call'=i
stability-ai text-to-image=w
stable-diffusion-webui textToImage=w
store add_to_list=W! append=W! get=r! put=W! remove_from_list=D! remove_value=D!
straico agent-add-rag=w agent-create=w agent-list=r agent_delete=d agent_get=r agent_prompt_completion=r agent_update=w create_rag=w delete_rag=d file_upload=w get_rag_by_id=r image_generation=r list_rags=r prompt_completion=r rag_prompt_completion=r update_rag=w
strale check_balance=r execute_capability=i search_capabilities=r trust_profile=r
streak create_box=w create_comment=w create_contact=w create_organization=w create_stage=w create_task=w find_box=r get_box=r get_current_user=r update_box=w
stripe cancel_subscription=f create_customer=w create_invoice=f create_payment_intent=f create_payment_link=w create_price=w create_product=w create_refund=f create_subscription=f deactivate_payment_link=d find_invoice=r retrieve_customer=r retrieve_invoice=r retrieve_payment_intent=r retrieve_payout=r search_customer=r search_subscriptions=r update_customer=w
subflows callFlow=i! returnResponse=W!
supabase create_row=w delete_rows=d get_table_schema=r list_tables=r search_rows=r update_row=w upload-file=w upsert_row=w
supadata get_transcript=r
surrealdb run-query=i
swarmnode execute-agent=i get-execution=r
synthesia createAVideoFromATemplate=w createVideo=w
systeme-io addTagToContact=w createContact=w findContactByEmail=r removeTagFromContact=w updateContact=w
tableau download_view=r find_workbook=r
tables tables-clear-table=D! tables-create-records=W! tables-create-table=W! tables-delete-record=D! tables-delete-table=D! tables-download-table=r! tables-find-records=r! tables-get-record=r! tables-update-record=W!
tags add_tag=w
talkable anonymize_person=d find_person=r get_loyalty_redeem_actions=r update-referral-status=w update_person=w
tapfiliate create_affiliate=w create_conversion=f get_affiliate=r list_affiliates=r
tarvent tarvent_create_audience_group=w tarvent_create_contact=w tarvent_create_contact_note=w tarvent_create_suppression_filter=w tarvent_create_transaction=o:toEmail tarvent_generate_custom_event=w tarvent_get_audience_groups=r tarvent_get_audiences=r tarvent_get_campaigns=r tarvent_get_contact=r tarvent_get_custom_event=r tarvent_get_journey=r tarvent_send_campaign=o tarvent_update_contact_group=w tarvent_update_contact_journey=w tarvent_update_contact_status=w tarvent_update_contact_tag=w tarvent_update_journey_status=w
taskade taskade-complete-task=w taskade-create-task=w taskade-delete-task=d
tavily extract=r search=r
teable teable_create_record=w teable_delete_record=d teable_get_record=r teable_list_records=r teable_update_record=w teable_upload_attachment=w
teamhood create_item=w create_row=w delete_item=d find_items=r get_item=r list_users=r update_item=w
teamleader create_company=w create_contact=w create_deal=w link_contact_to_company=w search_companies=r search_contacts=r search_deals=r search_invoices=r unlink_contact_from_company=w update_company=w update_contact=w update_deal=w
teamwork add_people_to_project=w create_company=w create_expense=w create_message_reply=o create_milestone=w create_notebook_comment=o create_person=o:email-address create_project=w create_stage=w create_task=w create_task_comment=o create_task_list=w create_time_entry_on_task=w find_company=r find_milestone=r find_notebook_or_comment=r find_task=r mark_task_complete=w update_task=w upload_file_to_project=w
telegram-bot answer_callback_query=o create_invite_link=w delete_message=d edit_message_text=o forward_message=o:chat_id get_chat=r get_chat_member=r get_file=r pin_message=w request_approval_message=o:chat_id send_audio=o:chat_id send_chat_action=o:chat_id send_document=o:chat_id send_location=o:chat_id send_media=o:chat_id send_media_group=o:chat_id send_poll=o:chat_id send_text_message=o:chat_id unpin_message=w
telnyx make_call=o:to send_sms=o:to
text-helper concat=r! defaultValue=r! find=r! find_all=r! html_to_markdown=r! json_to_ascii_table=r! markdown_to_html=r! replace=r! slugify=r! split=r! stripHtml=r!
textcortex-ai create_code=w create_email=w create_paraphrase=r create_product_description=r create_social_media_caption=r create_summary=r create_translation=r send_prompt=r
thankster send_handwritten_cards=o:r_address
ticktick complete_task=w create_task=w delete_task=d find_task=r get_project=r get_task=r update_task=w
tidely createAPlan=w importInvoice=w
time-ops create_customer=w create_project=w create_registration=w start_timer=w stop_timer=w
timelines-ai closeChat=w findChat=r findMessage=r findMessageStatus=r findUploadedFile=r findWhatsappAccount=r sendFileToExistingChat=o:chat_id sendMessageToExistingChat=o:chat_id sendMessageToNewChat=o:contact sendUploadedFileToExistingChat=o:chat_id
tiny-talk-ai ask-bot=r
tl-dv get_highlights=r get_meeting=r get_transcript=r list_meetings=r upload_recording=w
todoist create_task=w find_task=r mark_task_completed=w update_task=w
toggl-track create_client=w create_project=w create_tag=w create_task=w create_time_entry=w find_client=r find_project=r find_tag=r find_task=r find_time_entry=r find_user=r start_time_entry=w stop_time_entry=w
totalcms get_blog_post=r get_content=r save_blog_gallery=w save_blog_image=w save_blog_post=o save_date=w save_depot=w save_file=w save_gallery=w save_image=w save_text=w save_toggle=w save_video=w
trello add_card_attachment=w create_card=w delete_card=d delete_card_attachment=d get_card=r get_card_attachment=r get_card_attachments=r update_card=w
truelayer cancel-payment=f confirm-mandate-funds=r create-mandate=f create-payment=f create-payment-link=w create-payment-refund=f create-payout=f get-constraints=r get-mandate=r get-merchant-account-payment-sources=r get-operating-account=r get-payment=r get-payment-link=r get-payment-link-payments=r get-payment-provider=r get-payment-refund=r get-payment-refunds=r get-payout=r list-mandate=r list-operating-accounts=r merchant-account-disable-sweeping=w merchant-account-get-sweeping=r merchant-account-get-transactions=r merchant-account-setup-sweeping=f revoke-mandate=d save-user-account-payment=w search-payment-providers=r start-mandate-authorization-flow=w start-payment-authorization-flow=w start-payout-authorization-flow=w submit-consent=w submit-consent-mandate=w submit-form=w submit-mandate-provider-selection=w submit-payments-provider-return-parameters=w submit-provider-selection=w submit-scheme-selection=w submit-user-account-selection=w
trust create_contact=w create_testimonial=o delete_contact=d delete_testimonial=d find_contact=r find_testimonial=r update_contact=w update_testimonial=w upload_image=w upload_small_video=w upload_video=w
twenty create_company=w create_contact=w create_opportunity=w find_company=r find_person=r update_company=w update_person=w
twilio download_recording_media=r get_message=r phone_number_lookup=r send_sms=f:to
twin-labs startBrowsingTask=r
twitter create-reply=o create-tweet=o
typefully typefully_create_draft=w typefully_create_draft_advanced=w typefully_delete_draft=d typefully_get_draft=r typefully_list_drafts=r typefully_publish_draft_now=o typefully_schedule_draft=w typefully_upload_media=w
umami get_active_visitors=r get_pageviews=r get_website_metrics=r get_website_stats=r list_websites=r send_event=w
upgradechat addOrUpdateContact=w addOrUpdateContactExtended=o:contactId addOrUpdateSubscription=f createInvoice=f createProduct=w
uptimerobot create_monitor=w delete_monitor=d edit_monitor=w get_monitors=r pause_resume_monitor=w
uscreen assign_user_access=w create_user=o:email
useinbox add_contact_to_list=w create_campaign=o:lists create_contact_list=w send_transactional_email=o:toEmail unsubscribe_contact=w update_contact=w
vadoo-ai generate_ai_captions=w generate_ai_image=w generate_podcast=w generate_video=w
validatedmails validateEmail=r
valyu answer=r create_batch=w create_deep_research_task=w extract_content=r list_datasources=r search=r
vapi create_call=o:customerNumber get_call=r update_assistant=w
vbout vbout_add_contact=w vbout_add_email_marketing_campaign=w vbout_add_tag=w vbout_create_email_list=w vbout_create_social_media_message=o:channelid vbout_get_contact_by_email=r vbout_get_email_list=r vbout_remove_tag=w vbout_unsubscribe_contact=w vbout_update_contact=w
vercel create_deployment=w get_deployment_status=r list_environment_variables=r list_projects=r upsert_environment_variable=w
vero aliasAUser=w createOrUpdateUser=w deleteUser=d resubscribeUser=w trackEvent=w unsubscribe=w updateUsersTags=w
videoask addTagToContact=w createContact=w removeTagFromContact=w searchForm=r updateContact=w
vidlab7 createVideo=w
vidnoz generate_video_with_avatar=w generate_video_with_template=w
village add_list_items=w check_company_paths=r check_list_membership=r companies_refresh=w create_list=w delete_list=d enrich_company=r enrich_company_bulk=r enrich_person=r enrich_person_bulk=r enrich_person_email=r enrich_person_email_bulk=r get_app_info=r get_company_paths=r get_current_user=r get_list=r get_person_paths=r get_person_paths_bulk=r import_relationships=w join_group=w join_team=w leave_group=d leave_team=d list_companies=r list_groups=r list_integrations=r list_lists=r list_people=r list_teams=r people_refresh=w remove_list_items=d resync_integration=w search_companies=r search_people=r sort_companies=r sort_people=r update_integration=w update_list=w upsert_group=w upsert_team=w
vimeo add_video_to_folder=w add_video_to_showcase=w delete_video=d upload_video=w
visible create_metric=w create_or_update_contact=w create_portfolio_company=w
vlm-run analyzeAudio=w analyzeDocument=w analyzeImage=w analyzeVideo=w getFile=r
voipstudio createContact=w makeACall=o:to makeACallToLead=o:to makeAWebcall=o:to sendSms=o:to
vouchery-io createAVoucher=f createCustomer=w findVoucher=i
vtex Update-product=w create-brand=w create-product=w create-sku=w create-sku-file=w delete-brand=d get-brand-by-id=r get-brand-list=r get-category-by-id=r get-client-by-id=r get-client-list=r get-order-by-id=r get-order-list=r get-product-by-id=r get-sku-by-product-id=r update-brand=w
vtiger create_record=w delete_record=d get_record=r make_api_call=i query_records=i search_records=r
wafeq convert_quote_to_invoice=f create_bill=f create_contact=w create_credit_note=f create_invoice=f create_item=w create_quote=w create_simplified_invoice=f download_invoice_pdf=r find_contact=r list_accounts=r list_items=r record_payment=f report_invoice_to_tax_authority=w
waitwhile createACustomer=w createOrUpdateAVisit=w deleteAVisit=d searchCustomers=r
wayfront complete_activity=w create_activity=w create_client=w create_order=f create_ticket=w list_orders=r list_tickets=r update_activity=w update_client=w update_order=w update_ticket=w
wealthbox add_household_member=w create_contact=w create_event=o:invitees create_household=w create_note=w create_opportunity=w create_project=w create_task=w find_contact=r find_task=r start_workflow=w
webex createMessage=o:destination createRoom=w createTeam=w findMessage=r findRoom=r
webflow create_collection_item=w delete_collection_item=d find_collection_item=r find_order=r fulfill_order=o get_collection_item=r list_collections=r list_sites=r publish_collection_item=o refund_order=f unfulfill_order=w update_collection_item=w
webhook return_response=W! return_response_and_wait_for_next_webhook=W!
webling EventsById=r
webscraping-ai askAQuestionAboutTheWebPage=r extractStructuredData=r getAccountInformation=r getPageHtml=r scrapeWebsiteText=r
wedof abortCertificationFolder=w addExecutionTag=w billRegistrationFolder=f cancelRegistrationFolder=w createActivitie=w createCertificationFolder=w createCertificationPartnerAudit=w createGeneralAudit=w createPartnership=w createRegistrationFolder=w createTask=w declareCertificationFolderFailed=w declareCertificationFolderRegistred=w declareCertificationFolderSuccess=w declareCertificationFolderToControl=w declareCertificationFolderToRetake=w declareCertificationFolderToTake=w declareRegistrationFolderIntraining=w declareRegistrationFolderServicedone=w declareRegistrationFolderTerminated=w deletePartnership=d getCertificationFolder=r getCertificationFolderDocuments=r getCertificationFolderSurvey=r getMinimalSessionsDates=r getPartnership=r getRegistrationFolder=r getRegistrationFolderDocuments=r listActivitiesAndTasks=r listCertificationFolderSurveys=r listPartnerStats=r listPartnerships=r listRegistrationFolders=r me=r myOrganism=r refuseCertificationFolder=w refuseRegistrationFolder=w resetPartnership=w searchCertificationFolder=r sendFile=w updateCertificationFolder=w updateCompletionRate=w updatePartnership=w updateRegistrationFolder=w validateRegistrationFolder=w
week-done add_item_comment=w add_item_like=w assign_item=w create_item=w delete_item=d delete_item_comment=d delete_item_like=w get_company_info=r get_item_comments=r get_item_likes=r search_items=r sort_items=w update_item=w
weekdone create_objective=w update_item=w update_objective=w
what-converts create_lead=o export_leads=r find_lead=r update_lead=w
whatsable sendMessage=o:to
whatsapp send-template-message=o:to sendMedia=o:to sendMessage=o:to
whatsscale whatsscale_add_crm_contact_tag=w whatsscale_check_whatsapp=r whatsscale_create_crm_contact=w whatsscale_delete_crm_contact=d whatsscale_find_crm_contact_by_phone=r whatsscale_get_crm_contact=r whatsscale_list_crm_contacts=r whatsscale_remove_crm_contact_tag=w whatsscale_send_document_to_contact=o:contact whatsscale_send_document_to_crm_contact=o:crmContact whatsscale_send_document_to_group=o:group whatsscale_send_image_manual=o:recipient whatsscale_send_image_to_channel=o:channel whatsscale_send_image_to_contact=o:contact whatsscale_send_image_to_crm_contact=o:crmContact whatsscale_send_image_to_group=o:group whatsscale_send_text_manual=o:recipient whatsscale_send_text_to_channel=o:channel whatsscale_send_text_to_contact=o:contact whatsscale_send_text_to_crm_contact=o:crmContact whatsscale_send_text_to_group=o:group whatsscale_send_video_manual=o:recipient whatsscale_send_video_to_channel=o:channel whatsscale_send_video_to_contact=o:contact whatsscale_send_video_to_crm_contact=o:crmContact whatsscale_send_video_to_group=o:group whatsscale_update_crm_contact=w
wistia copy_media=w create_project=w delete_media=d find_media=r get_media=r update_media=w update_project=w
wonderchat addPage=w addTag=w askQuestion=r removeTag=w
woocommerce Create Coupon=w Create Customer=w Create Product=w Find Coupon=r Find Customer=r Find Product=r
woodpecker add_prospect_to_campaign=w add_prospect_to_list=w blacklist_domain=w find_prospect_by_email=r get_prospect_responses=r
wootric trigger_wootric_survey=o:emails
wordpress create_page=o create_post=o get_post=r update_post=w
workable getCandidate=r getJob=r getMembers=r getStages=r moveCandidate=w rateCandidate=w
workday call_operation=i create_update_custom_object=w find_purchase_order=r find_records_wql=i find_supplier=r find_supplier_invoice=r find_supplier_payment=r get_business_object_details_batch=r get_custom_objects=r get_report=r get_report_wql_batch=i list_custom_object_definitions_batch=r search_business_object_batch=r update_business_object=w
wrike add_comment=o create_folder=w create_project=w create_task=w find_folder=r find_task=r update_task=w upload_attachment=w
writesonic-bulk blogIdeas=f blogIntros=f blogOutlines=f contentRephraser=f contentShorten=f facebookAds=f generateProductDescriptions=f googleAds=f landingPageHeadlines=f sentenceExpander=f
wufoo create-form-entry=w find-form=r find-submission-by-field=r get-entry-details=r
xero xero_add_items_to_sales_invoice=f xero_allocate_credit_note_to_invoice=f xero_create_bank_transaction=f xero_create_bank_transfer=f xero_create_bill=f xero_create_contact=w xero_create_credit_note=f xero_create_inventory_item=w xero_create_invoice=f xero_create_payment=f xero_create_project=w xero_create_purchase_order=f xero_create_quote_draft=w xero_create_repeating_sales_invoice=f xero_find_contact=r xero_find_invoice=r xero_find_item=r xero_find_or_create_contact=w xero_find_purchase_order=r xero_get_invoice_history=r xero_send_invoice_email=o xero_update_purchase_order=f xero_update_sales_invoice=f xero_upload_attachment=w
xml convert-json-to-xml=r! convert-xml-to-json=r!
xquik get_trends=r get_tweet=r get_user=r get_user_tweets=r search_tweets=r search_users=r
youcanbookme create-profile=w retrieveBookingById=r
youtrack add_comment=o add_tag_to_issue=w add_user_to_team=w apply_command=w create_issue=w create_tag=w delete_attachment=d download_attachment=r get_issue=r get_issue_history=r link_issues=w list_attachments=r list_comments=r list_tags=r remove_tag_from_issue=w search_issues=r update_issue=w
youtube download_caption=r list_captions=r list_playlist_items=r search=r
zagomail createSubscriber=w getCampaignDetails=r getSubscriberDetails=r searchSubscriberByEmail=r tagSubscriber=w unsubscribeSubscriber=w updateSubscriber=w
zendesk add-comment-to-ticket=o add-tag-to-ticket=w attach-file-to-ticket=w create-organization=w create-ticket=o:requester_email create-user=w delete-user=d find-agent=r find-group=r find-latest-comment=r find-organization=r find-tickets=r find-user=r remove-tag-from-ticket=w update-organization=w update-ticket=w update-user=w
zendesk-sell create_contact=w create_deal=w create_lead=w create_note=w find_company=r find_contact=r find_deal=r find_lead=r find_user=r update_contact=w update_deal=w
zeplin createNote=w findProject=r findScreen=r updateProject=w updateScreen=w
zerobounce validateEmail=w
zoho-bookings bookAppointment=w cancelAppointment=w fetchAvailability=r getAppointmentDetails=r rescheduleAppointment=w
zoho-campaigns addContactToMailingList=w addTagToContact=w addUpdateContact=o:email cloneCampaign=w createCampaign=w findCampaign=r findContact=r removeTag=w sendCampaign=o unsubscribeContact=w
zoho-crm read-file=r
zoho-desk create_ticket=w find-contact=r list_tickets=r
zoho-mail archive_email=w get_email_details=r mark_email_as_read=w mark_email_as_unread=w move_email=w send_email=o:toAddress unarchive_email=w
zoo add_org_member=o:email convert_angle=r convert_area=r convert_cad_file=w convert_current=r convert_energy=r convert_force=r convert_frequency=r convert_length=r convert_mass=r convert_power=r convert_pressure=r convert_temperature=r convert_torque=r convert_volume=r create_api_token=w create_org=w create_org_payment=w create_org_subscription=f create_service_account=w create_shortlink=w create_user_payment=w create_user_subscription=f delete_api_token=d delete_org_payment=d delete_service_account=d delete_shortlink=d delete_user=d delete_user_payment=d generate_cad_model=w get_api_token=r get_async_operation=r get_cad_model=r get_center_of_mass=r get_density=r get_extended_user=r get_mass=r get_oauth2_providers=r get_openapi_schema=r get_org=r get_org_api_call=r get_org_balance=r get_org_member=r get_org_payment=r get_org_subscription=r get_privacy_settings=r get_service_account=r get_surface_area=r get_user=r get_user_api_call=r get_user_balance=r get_user_org=r get_user_payment=r get_user_session=r get_user_subscription=r get_volume=r give_model_feedback=w kcl_completions=r list_api_tokens=r list_cad_models=r list_org_api_calls=r list_org_invoices=r list_org_members=r list_org_payment_methods=r list_org_shortlinks=r list_service_accounts=r list_user_api_calls=r list_user_invoices=r list_user_payment_methods=r list_user_shortlinks=r return_pong=r send_modeling_command=r text_to_cad_iteration=w update_org=w update_org_payment=w update_org_subscription=f update_privacy_settings=w update_shortlink=w update_user=w update_user_payment=w update_user_subscription=f
zoom zoom_create_meeting=w zoom_create_meeting_registrant=w zoom_find_meeting=r zoom_update_meeting=w
zuora create-invoice=f find-account=r find-product=r find-product-rate-plan=r
`

function decode(encoded: string): Record<string, ActionEffectLabel> {
    const labels: Record<string, ActionEffectLabel> = {}
    for (const line of encoded.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.length === 0) {
            continue
        }
        const firstSpace = trimmed.indexOf(' ')
        if (firstSpace <= 0) {
            continue
        }
        const piece = trimmed.slice(0, firstSpace)
        for (const entry of trimmed.slice(firstSpace + 1).split(' ')) {
            const separator = entry.lastIndexOf('=')
            if (separator <= 0) {
                continue
            }
            const [rawCode, recipientProp] = entry.slice(separator + 1).split(':')
            const authoritative = rawCode.endsWith('!')
            const kind = KIND_BY_CODE[authoritative ? rawCode.slice(0, -1) : rawCode]
            if (kind === undefined) {
                continue
            }
            const key = `@activepieces/piece-${piece}:${entry.slice(0, separator)}`
            labels[key] = {
                kind,
                ...(recipientProp ? { recipientProp } : {}),
                ...(authoritative ? { authoritative: true } : {}),
            }
        }
    }
    return labels
}

export const ACTION_EFFECT_LABELS: Record<string, ActionEffectLabel> = decode(ENCODED_LABELS)
